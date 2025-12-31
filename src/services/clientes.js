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
  Timestamp
} from "firebase/firestore";

// Referencia a la colección "clientes"
const clientesCollection = collection(db, "clientes");

/**
 * Crea un nuevo cliente en Firestore.
 *
 * @param {{ nombre: string, telefono: string, email: string, observaciones?: string, authUid?: string }} data
 * @returns {Promise<string>} id del cliente creado
 */
export async function crearCliente(data) {
  const now = serverTimestamp();

  const docRef = await addDoc(clientesCollection, {
    nombre: data.nombre,
    telefono: data.telefono,
    email: data.email,
    observaciones: data.observaciones || "",
    authUid: data.authUid || null,
    activo: true,
    createdAt: now,
    updatedAt: now
  });

  return docRef.id;
}

/**
 * Devuelve la lista de clientes.
 *
 * @param {{ soloActivos?: boolean }} [opciones]
 * @returns {Promise<Array<Object>>}
 */
export async function listarClientes(opciones = {}) {
  const { soloActivos = false } = opciones;

  let q;

  if (soloActivos) {
    q = query(
      clientesCollection,
      where("activo", "==", true),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      clientesCollection,
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(q);

  const clientes = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  return clientes;
}

/**
 * Obtiene un cliente por su id.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function obtenerClientePorId(id) {
  const ref = doc(db, "clientes", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data()
  };
}

/**
 * Actualiza un cliente.
 *
 * @param {string} id
 * @param {Partial<{ nombre: string, telefono: string, email: string, observaciones: string, authUid: string, activo: boolean }>} data
 * @returns {Promise<void>}
 */
export async function actualizarCliente(id, data) {
  const ref = doc(db, "clientes", id);

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Desactiva un cliente (sin borrarlo).
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function desactivarCliente(id) {
  const ref = doc(db, "clientes", id);

  await updateDoc(ref, {
    activo: false,
    updatedAt: serverTimestamp()
  });
}

export async function obtenerCliente(id) {
  const ref = doc(db, "clientes", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data()
  };
}