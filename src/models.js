// src/models.js
// Acá no hay tipos "reales", solo documentación para vos y para el editor.
// Firestore va a guardar objetos con esta forma.

/**
 * @typedef {Object} Cliente
 * @property {string} id              ID del documento en "clientes"
 * @property {string} nombre
 * @property {string} telefono
 * @property {string} email
 * @property {string} [observaciones] Notas internas
 * @property {string} [authUid]       UID de Firebase Auth si el cliente se loguea
 * @property {boolean} activo
 * @property {*} createdAt            Timestamp de Firestore
 * @property {*} updatedAt            Timestamp de Firestore
 */

/**
 * @typedef {"unico" | "cuotas" | "parcial"} TipoPago
 */

/**
 * @typedef {"borrador" | "pendiente" | "parcialmente_pagada" | "pagada" | "enviado" | "entregado" | "cancelado"} EstadoOrden
 */

/**
 * @typedef {Object} OrdenHistorialItem
 * @property {*} fecha                 Timestamp de Firestore
 * @property {"estado" | "pago" | "nota"} tipo
 * @property {string} detalle
 * @property {string} [usuarioId]      ID del admin que hizo la acción
 */

/**
 * @typedef {Object} Orden
 * @property {string} id
 * @property {string} clienteId
 * @property {string} concepto
 * @property {number} total
 * @property {TipoPago} tipoPago
 * @property {number} [totalCuotasPlaneadas]
 * @property {number} [montoCuotaCalculado]
 * @property {EstadoOrden} estado
 * @property {boolean} preVenta
 * @property {*} [fechaSalida]
 * @property {number} totalPagado
 * @property {number} saldoPendiente
 * @property {boolean} pagoCompleto
 * @property {*} createdAt
 * @property {*} updatedAt
 * @property {OrdenHistorialItem[]} historial
 */

/**
 * @typedef {Object} Pago
 * @property {string} id
 * @property {string} clienteId
 * @property {string} ordenId
 * @property {number} monto
 * @property {TipoPago} tipoPago
 * @property {number} [numeroCuota]
 * @property {number} [totalCuotas]
 * @property {number} [montoCuotaEsperado]
 * @property {string} medio
 * @property {boolean} confirmado
 * @property {string} [nota]
 * @property {*} createdAt
 * @property {string} [registradoPor]
 */

export {}; // Para que el archivo sea un módulo y JSDoc funcione bien
