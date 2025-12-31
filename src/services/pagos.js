// src/services/pagos.js
import { db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  getDoc,
  Timestamp,updateDoc,
  deleteDoc
} from "firebase/firestore";

const pagosCollection = collection(db, "pagos");
const ordenesCollection = collection(db, "ordenes");

/**
 * Lista todos los pagos (para la tabla principal).
 * Ordenados del más nuevo al más viejo.
 */
export async function listarPagos() {
  const q = query(pagosCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((snap) => ({
    id: snap.id,
    ...snap.data()
  }));
}

/**
 * Lista pagos de una orden específica.
 */


/**
 * Registra un pago y actualiza la orden (totalPagado, saldo, estado, cuotas, historial).
 *
 * NOTA:
 * - No hace falta pasar clienteId ni tipoPago desde el front:
 *   se leen desde la orden.
 */
export async function registrarPago(data) {
  /**
   * data:
   * {
   *   ordenId: string,
   *   monto: number,
   *   medio: string,
   *   confirmado: boolean,
   *   numeroCuota?: number, // ya no es necesario desde el front, pero lo dejamos opcional
   *   nota?: string,
   *   usuarioId: string
   * }
   */

  const nowServer = serverTimestamp();   // para createdAt / updatedAt
  const nowFechaHist = Timestamp.now();  // para historial.fecha
  const ordenRef = doc(db, "ordenes", data.ordenId);

  await runTransaction(db, async (tx) => {
    const ordenSnap = await tx.get(ordenRef);
    if (!ordenSnap.exists()) {
      throw new Error("La orden no existe");
    }

    const orden = ordenSnap.data();

    const clienteId = orden.clienteId;
    const tipoPago = orden.tipoPago;
    const totalCuotas = orden.totalCuotasPlaneadas || null;
    const montoCuotaEsperado = orden.montoCuotaCalculado || null;

    // 🔐 Validación de negocio en el back
    if (data.confirmado && tipoPago === "parcial") {
      const saldoActual =
        orden.saldoPendiente ?? (orden.total - (orden.totalPagado || 0));
      if (data.monto > saldoActual) {
        throw new Error(
          `El monto del pago (${data.monto}) no puede ser mayor al saldo pendiente (${saldoActual}).`
        );
      }
    }

    // Número de cuota: lo calculamos automáticamente si la orden es de cuotas
    let numeroCuotaPago = data.numeroCuota ?? null;
    if (data.confirmado && tipoPago === "cuotas" && totalCuotas) {
      const cuotasPagadasPrevias = orden.cuotasPagadas || 0;
      const siguienteCuota = Math.min(cuotasPagadasPrevias + 1, totalCuotas);
      numeroCuotaPago = siguienteCuota;
    }

    // Crear documento de pago
    const nuevoPagoRef = doc(pagosCollection);
    const pagoData = {
      id: nuevoPagoRef.id,
      clienteId,
      ordenId: data.ordenId,
      monto: data.monto,
      tipoPago,
      numeroCuota: numeroCuotaPago,
      totalCuotas,
      montoCuotaEsperado,
      medio: data.medio,
      confirmado: data.confirmado,
      nota: data.nota || "",
      createdAt: nowServer,
      registradoPor: data.usuarioId
    };

    tx.set(nuevoPagoRef, pagoData);

    // Si el pago NO está confirmado, no tocamos el estado financiero de la orden
    if (!data.confirmado) {
      tx.update(ordenRef, {
        updatedAt: nowServer
      });
      return;
    }

    // Recalcular totales
    const totalPagadoAnterior = orden.totalPagado || 0;
    const totalPagadoNuevo = totalPagadoAnterior + data.monto;
    let saldoPendienteNuevo = orden.total - totalPagadoNuevo;
    if (saldoPendienteNuevo < 0) saldoPendienteNuevo = 0;

    const pagoCompletoNuevo = saldoPendienteNuevo === 0;

    let nuevoEstado = orden.estado || "pendiente";
    if (pagoCompletoNuevo) {
      nuevoEstado = "pagada";
    } else if (totalPagadoNuevo > 0 && saldoPendienteNuevo > 0) {
      nuevoEstado = "parcialmente_pagada";
    }

    // Cálculo de cuotas (solo si la orden es por cuotas)
    let cuotasPagadasNuevo = orden.cuotasPagadas ?? null;
    let cuotasPendientesNuevo = orden.cuotasPendientes ?? null;

    if (
      tipoPago === "cuotas" &&
      orden.totalCuotasPlaneadas &&
      orden.montoCuotaCalculado
    ) {
      const montoCuota = orden.montoCuotaCalculado;
      const totalCuotasOrden = orden.totalCuotasPlaneadas;

      const cuotasCalculadas = Math.floor(totalPagadoNuevo / montoCuota);
      const pagadas = Math.min(cuotasCalculadas, totalCuotasOrden);

      cuotasPagadasNuevo = pagadas;
      cuotasPendientesNuevo = totalCuotasOrden - pagadas;
    }

    // 🗓️ Nuevo: calcular próxima fecha de vencimiento de cuota
    let proximaCuotaVencimientoNuevo = orden.proximaCuotaVencimiento || null;
    const primeraVto = orden.primeraCuotaVencimiento;

    if (
      tipoPago === "cuotas" &&
      primeraVto &&
      primeraVto.toDate &&
      orden.totalCuotasPlaneadas
    ) {
      const totalCuotasOrden = orden.totalCuotasPlaneadas;
      const pagadas = cuotasPagadasNuevo || 0;

      if (pagadas >= totalCuotasOrden || pagoCompletoNuevo) {
        // Todas las cuotas pagadas → sin próximo vencimiento
        proximaCuotaVencimientoNuevo = null;
      } else {
        // Primera cuota vence en primeraVto,
        // la cuota (pagadas + 1) vence en primeraVto + pagadas meses
        const base = primeraVto.toDate();
        const nuevaFecha = new Date(
          base.getFullYear(),
          base.getMonth() + pagadas, // si pagadas = 0 → primera, si 1 → +1 mes, etc.
          base.getDate()
        );
        proximaCuotaVencimientoNuevo = Timestamp.fromDate(nuevaFecha);
      }
    }

    const historialAnterior = orden.historial || [];
    const nuevoHistorial = [
      ...historialAnterior,
      {
        fecha: nowFechaHist,
        tipo: "pago",
        detalle: `Pago registrado por $${data.monto}`,
        usuarioId: data.usuarioId
      }
    ];

    tx.update(ordenRef, {
      totalPagado: totalPagadoNuevo,
      saldoPendiente: saldoPendienteNuevo,
      pagoCompleto: pagoCompletoNuevo,
      estado: nuevoEstado,
      historial: nuevoHistorial,
      cuotasPagadas: cuotasPagadasNuevo,
      cuotasPendientes: cuotasPendientesNuevo,
      proximaCuotaVencimiento: proximaCuotaVencimientoNuevo, // 👈 aquí se guarda
      updatedAt: nowServer
    });
  });
}

export async function listarPagosPorCliente(clienteId) {
  const q = query(
    pagosCollection,
    where("clienteId", "==", clienteId)
    // también sacamos orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  const pagos = snapshot.docs.map((snap) => ({
    id: snap.id,
    ...snap.data()
  }));

  return pagos.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.toMillis
      ? a.createdAt.toMillis()
      : 0;
    const tb = b.createdAt && b.createdAt.toMillis
      ? b.createdAt.toMillis()
      : 0;
    return tb - ta;
  });
}

export async function listarPagosPorOrden(ordenId) {
  const q = query(
    pagosCollection,
    where("ordenId", "==", ordenId)
  );

  const snapshot = await getDocs(q);
  const pagos = snapshot.docs.map((snap) => ({
    id: snap.id,
    ...snap.data()
  }));

  // opcional: ordenarlos por fecha desc
  return pagos.sort((a, b) => {
    const ta = a.createdAt && a.createdAt.toMillis
      ? a.createdAt.toMillis()
      : 0;
    const tb = b.createdAt && b.createdAt.toMillis
      ? b.createdAt.toMillis()
      : 0;
    return tb - ta;
  });
}
// Recalcula totalPagado, saldoPendiente y pagoCompleto de una orden
// Recalcula totalPagado, saldoPendiente, pagoCompleto, estado y cuotas de una orden
export async function recalcularOrdenDesdePagos(ordenId) {
  if (!ordenId) return;

  const ordenRef = doc(ordenesCollection, ordenId);
  const ordenSnap = await getDoc(ordenRef);
  if (!ordenSnap.exists()) return;

  const orden = ordenSnap.data();
  const total = orden.total || 0;
  const tipoPago = orden.tipoPago;
  const totalCuotasPlaneadas = orden.totalCuotasPlaneadas || null;
  const montoCuotaCalculado = orden.montoCuotaCalculado || null;

  // Traemos todos los pagos confirmados de esa orden
  const q = query(pagosCollection, where("ordenId", "==", ordenId));
  const snapPagos = await getDocs(q);

  let totalPagado = 0;
  snapPagos.forEach((d) => {
    const p = d.data();
    if (p.confirmado) {
      totalPagado += p.monto || 0;
    }
  });

  const saldoPendiente = Math.max(total - totalPagado, 0);
  const pagoCompleto = saldoPendiente === 0 && total > 0;

  // Estado de la orden según los montos
  let nuevoEstado = orden.estado || "pendiente";
  if (pagoCompleto) {
    nuevoEstado = "pagada";
  } else if (totalPagado > 0 && saldoPendiente > 0) {
    nuevoEstado = "parcialmente_pagada";
  } else if (totalPagado === 0) {
    nuevoEstado = "pendiente";
  }

  // Cuotas (solo para tipo "cuotas")
  let cuotasPagadasNuevo = orden.cuotasPagadas ?? null;
  let cuotasPendientesNuevo = orden.cuotasPendientes ?? null;

  if (
    tipoPago === "cuotas" &&
    totalCuotasPlaneadas &&
    montoCuotaCalculado
  ) {
    const cuotasCalculadas = Math.floor(totalPagado / montoCuotaCalculado);
    const pagadas = Math.min(cuotasCalculadas, totalCuotasPlaneadas);
    cuotasPagadasNuevo = pagadas;
    cuotasPendientesNuevo = totalCuotasPlaneadas - pagadas;
  }

  await updateDoc(ordenRef, {
    totalPagado,
    saldoPendiente,
    pagoCompleto,
    estado: nuevoEstado,
    cuotasPagadas: cuotasPagadasNuevo,
    cuotasPendientes: cuotasPendientesNuevo,
    updatedAt: serverTimestamp()
  });
}

export async function actualizarPago(pagoId, data) {
  const ref = doc(pagosCollection, pagoId);
  await updateDoc(ref, data);
}

export async function eliminarPago(pagoId) {
  const ref = doc(pagosCollection, pagoId);
  await deleteDoc(ref);
}
// Editar un pago y luego recalcular la orden correspondiente
// Editar un pago y luego recalcular la orden correspondiente + historial
export async function editarPagoConRecalculo(pagoId, dataActualizada) {
  const pagoRef = doc(pagosCollection, pagoId);
  const pagoSnap = await getDoc(pagoRef);

  if (!pagoSnap.exists()) {
    throw new Error("El pago no existe");
  }

  const pagoAnterior = pagoSnap.data();
  const ordenId = pagoAnterior.ordenId;
  const ordenRef = doc(ordenesCollection, ordenId);
  const ordenSnap = await getDoc(ordenRef);

  if (!ordenSnap.exists()) {
    throw new Error("La orden asociada al pago no existe");
  }

  const orden = ordenSnap.data();
  const historialAnterior = orden.historial || [];

  // Actualizamos el pago
  await updateDoc(pagoRef, dataActualizada);

  // Registramos en historial que se editó el pago
  const nowFechaHist = Timestamp.now();
  const detalle = `Pago editado: de $${pagoAnterior.monto} a $${dataActualizada.monto}`;

  const nuevoHistorial = [
    ...historialAnterior,
    {
      fecha: nowFechaHist,
      tipo: "pago_editado",
      detalle,
      usuarioId: pagoAnterior.registradoPor || dataActualizada.usuarioId || "sistema"
    }
  ];

  await updateDoc(ordenRef, {
    historial: nuevoHistorial,
    updatedAt: serverTimestamp()
  });

  // Recalcular totales, estado y cuotas
  await recalcularOrdenDesdePagos(ordenId);
}


// Eliminar un pago y luego recalcular la orden correspondiente
// Eliminar un pago y luego recalcular la orden correspondiente + historial
export async function eliminarPagoConRecalculo(pagoId) {
  const pagoRef = doc(pagosCollection, pagoId);
  const pagoSnap = await getDoc(pagoRef);

  if (!pagoSnap.exists()) {
    throw new Error("El pago no existe");
  }

  const pago = pagoSnap.data();
  const ordenId = pago.ordenId;

  const ordenRef = doc(ordenesCollection, ordenId);
  const ordenSnap = await getDoc(ordenRef);

  if (!ordenSnap.exists()) {
    throw new Error("La orden asociada al pago no existe");
  }

  const orden = ordenSnap.data();
  const historialAnterior = orden.historial || [];

  // Borramos el pago
  await deleteDoc(pagoRef);

  // Registramos en historial la eliminación del pago
  const nowFechaHist = Timestamp.now();
  const detalle = `Pago eliminado por $${pago.monto}`;

  const nuevoHistorial = [
    ...historialAnterior,
    {
      fecha: nowFechaHist,
      tipo: "pago_eliminado",
      detalle,
      usuarioId: pago.registradoPor || "sistema"
    }
  ];

  await updateDoc(ordenRef, {
    historial: nuevoHistorial,
    updatedAt: serverTimestamp()
  });

  // Recalcular totales, estado y cuotas
  await recalcularOrdenDesdePagos(ordenId);
}

