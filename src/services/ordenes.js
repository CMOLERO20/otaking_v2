// src/services/ordenes.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
   deleteDoc
} from "firebase/firestore";

const ordenesCollection = collection(db, "ordenes");


async function generarNumeroOrden() {
  const counterRef = doc(db, "counters", "ordenes");

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);

    const last = snap.exists() ? snap.data().lastNumber || 0 : 0;
    const next = last + 1;

    tx.set(counterRef, { lastNumber: next }, { merge: true });

    // Formato: ORD-000123
    const numeroFormateado = `OTK-${String(next).padStart(6, "0")}`;

    return {
      numero: next,
      numeroFormateado
    };
  });
}

/**
 * Crea una nueva orden.
 *
 * @param {{
 *  clienteId: string,
 *  concepto: string,
 *  total: number,
 *  esPreventa: boolean,
 *  tipoPago: "unico" | "cuotas" | "parcial",
 *  totalCuotasPlaneadas?: number,
 *  fechaSalida?: Date,
 *  usuarioId: string
 * }} data
 * @returns {Promise<string>} id de la orden creada
 */
export async function crearOrden(data) {
  const nowServer = serverTimestamp();   // para createdAt / updatedAt
  const nowFechaHist = Timestamp.now();  // para historial.fecha
  const { numero, numeroFormateado } = await generarNumeroOrden();

  // Calculamos monto por cuota si aplica
  let montoCuotaCalculado = null;
  if (data.tipoPago === "cuotas" && data.totalCuotasPlaneadas) {
    montoCuotaCalculado = data.total / data.totalCuotasPlaneadas;
  }

  // 👉 NUEVO: manejar fecha de vencimiento de la primera cuota
  let primeraCuotaDate = null;
  if (data.tipoPago === "cuotas" && data.primeraCuotaVencimiento) {
    if (data.primeraCuotaVencimiento instanceof Date) {
      primeraCuotaDate = data.primeraCuotaVencimiento;
    } else {
      // si viene como string desde <TextField type="date">
      primeraCuotaDate = new Date(data.primeraCuotaVencimiento + "T00:00:00");
    }
  }

  const primeraCuotaVencimiento = primeraCuotaDate
    ? Timestamp.fromDate(primeraCuotaDate)
    : null;

  const proximaCuotaVencimiento = primeraCuotaVencimiento;

  const docRef = await addDoc(ordenesCollection, {
    clienteId: data.clienteId,
    concepto: data.concepto,
    total: data.total,
    tipoPago: data.tipoPago,
    totalCuotasPlaneadas: data.totalCuotasPlaneadas || null,
    montoCuotaCalculado: montoCuotaCalculado,

    // cuotas
    cuotasPagadas:
      data.tipoPago === "cuotas" && data.totalCuotasPlaneadas
        ? 0
        : null,
    cuotasPendientes:
      data.tipoPago === "cuotas" && data.totalCuotasPlaneadas
        ? data.totalCuotasPlaneadas
        : null,

    // 🔥 NUEVOS CAMPOS
    primeraCuotaVencimiento,
    proximaCuotaVencimiento,

    // preventa
    esPreventa: !!data.esPreventa,
    fechaSalida:
      data.esPreventa && data.fechaSalida
        ? Timestamp.fromDate(data.fechaSalida)
        : null,

    estado: "pendiente",
    ordenNumero: numero,
    ordenCodigo: numeroFormateado,

    totalPagado: 0,
    saldoPendiente: data.total,
    pagoCompleto: false,

    createdAt: nowServer,
    updatedAt: nowServer,

    historial: [
      {
        fecha: nowFechaHist,
        tipo: "estado",
        detalle: "Orden creada en estado pendiente",
        usuarioId: data.usuarioId
      }
    ]
  });

  return docRef.id;
}




/**
 * Lista órdenes.
 * - Si pasás clienteId, trae solo las de ese cliente.
 * - Si no, trae todas (para admin).
 *
 * @param {{ clienteId?: string }} [filtros]
 * @returns {Promise<Array<Object>>}
 */
export async function listarOrdenes(filtros = {}) {
  const { clienteId } = filtros;

  let q;
  if (clienteId) {
    q = query(
      ordenesCollection,
      where("clienteId", "==", clienteId),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(ordenesCollection, orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

/**
 * Obtiene una orden por id.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function obtenerOrdenPorId(id) {
  const ref = doc(db, "ordenes", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data()
  };
}

/**
 * Actualiza una orden con cambios parciales.
 *
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<void>}
 */
export async function actualizarOrden(id, data) {
  const ref = doc(db, "ordenes", id);

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Agrega un item al historial de una orden.
 *
 * @param {string} id
 * @param {{ tipo: "estado" | "pago" | "nota", detalle: string, usuarioId?: string }} item
 * @returns {Promise<void>}
 */
export async function agregarHistorialOrden(id, item) {
  const ref = doc(db, "ordenes", id);
  const nowServer = serverTimestamp();
  const nowFechaHist = Timestamp.now();

  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const orden = snap.data();

  const nuevoHistorial = [
    ...(orden.historial || []),
    {
      fecha: nowFechaHist,         // 👈 Timestamp.now()
      tipo: item.tipo,
      detalle: item.detalle,
      usuarioId: item.usuarioId || null
    }
  ];

  await updateDoc(ref, {
    historial: nuevoHistorial,
    updatedAt: nowServer
  });
}

export async function listarOrdenesPorCliente(clienteId) {
  const q = query(
    ordenesCollection,
    where("clienteId", "==", clienteId)
    // sacamos el orderBy("createdAt", "desc") para evitar índice compuesto
  );

  const snapshot = await getDocs(q);
  const ordenes = snapshot.docs.map((snap) => ({
    id: snap.id,
    ...snap.data()
  }));

  // Ordenamos en el front por createdAt (desc)
  return ordenes.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.toMillis
      ? a.createdAt.toMillis()
      : 0;
    const tb = b.createdAt && b.createdAt.toMillis
      ? b.createdAt.toMillis()
      : 0;
    return tb - ta; // más nuevo primero
  });
}
export async function obtenerOrden(id) {
  const ref = doc(db, "ordenes", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data()
  };
}

export async function eliminarOrden(id) {
  const ref = doc(db, "ordenes", id);
  await deleteDoc(ref);
}