// src/pages/admin/PagosPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress
} from "@mui/material";

import { listarClientes } from "../../services/clientes";
import { listarOrdenes } from "../../services/ordenes";
import {
  listarPagos,
  registrarPago,
  editarPagoConRecalculo,
  eliminarPagoConRecalculo
} from "../../services/pagos";

import PagosTable from "../../components/pagos/PagosTable";
import PagoFormDialog from "../../components/pagos/PagoFormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";

function PagosPage() {
  const [clientes, setClientes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);

  // Dialog alta/edición de pago
  const [openModal, setOpenModal] = useState(false);
  const [modoPago, setModoPago] = useState("crear"); // "crear" | "editar"
  const [pagoEditando, setPagoEditando] = useState(null);

  const [form, setForm] = useState({
    clienteId: "",
    ordenId: "",
    monto: "",
    medio: "",
    confirmado: true,
    nota: ""
  });
  const [errorForm, setErrorForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // edición / eliminación para deshabilitar botones en la tabla
  const [editandoPagoId, setEditandoPagoId] = useState(null);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);
  const [deletePagoDialogOpen, setDeletePagoDialogOpen] = useState(false);
  const [eliminandoPagoId, setEliminandoPagoId] = useState(null);
  const [errorDeletePago, setErrorDeletePago] = useState(null);

  const clientesMap = useMemo(() => {
    const map = {};
    clientes.forEach((c) => {
      map[c.id] = c.nombre;
    });
    return map;
  }, [clientes]);

  const ordenesMap = useMemo(() => {
    const map = {};
    ordenes.forEach((o) => {
      map[o.id] = o;
    });
    return map;
  }, [ordenes]);

  // Órdenes disponibles según cliente seleccionado (solo pendientes)
  const ordenesCliente = useMemo(() => {
    if (!form.clienteId) return [];
    return ordenes.filter((o) => {
      const esDelCliente = o.clienteId === form.clienteId;
      const estaPagada = o.pagoCompleto === true;
      return esDelCliente && !estaPagada;
    });
  }, [ordenes, form.clienteId]);

  const selectedOrden = useMemo(() => {
    if (!form.ordenId) return null;
    return ordenesMap[form.ordenId] || null;
  }, [form.ordenId, ordenesMap]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [clientesData, ordenesData, pagosData] = await Promise.all([
        listarClientes({ soloActivos: false }),
        listarOrdenes(),
        listarPagos()
      ]);
      setClientes(clientesData);
      setOrdenes(ordenesData);
      setPagos(pagosData);
      setErrorGlobal(null);
    } catch (err) {
      console.error(err);
      setErrorGlobal("Error al cargar datos de pagos");
    } finally {
      setCargando(false);
    }
  }

  // =====================
  //   ABRIR / CERRAR MODAL
  // =====================

  function handleOpenModal() {
    // modo crear
    setModoPago("crear");
    setPagoEditando(null);
    setErrorForm(null);

    setForm({
      clienteId: "",
      ordenId: "",
      monto: "",
      medio: "",
      confirmado: true,
      nota: ""
    });

    setOpenModal(true);
  }

  function handleCloseModal() {
    if (guardando) return;
    setOpenModal(false);
    setModoPago("crear");
    setPagoEditando(null);
    setErrorForm(null);
  }

  // =====================
  //   CAMBIOS FORM
  // =====================

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "clienteId") {
        // si cambia el cliente, reseteamos la orden solo en modo crear
        if (modoPago === "crear") {
          return { ...prev, clienteId: value, ordenId: "" };
        }
      }
      return { ...prev, [name]: value };
    });
  }

  function handleConfirmadoChange(e) {
    const { checked } = e.target;
    setForm((prev) => ({ ...prev, confirmado: checked }));
  }

  // =====================
  //   SUBMIT (CREAR / EDITAR PAGO)
  // =====================

  async function handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!form.clienteId) {
      setErrorForm("Seleccioná un cliente");
      return;
    }
    if (!form.ordenId) {
      setErrorForm("Seleccioná una orden");
      return;
    }
    if (!form.monto) {
      setErrorForm("El monto es obligatorio");
      return;
    }

    const montoNumber = Number(form.monto);
    if (Number.isNaN(montoNumber) || montoNumber <= 0) {
      setErrorForm("El monto debe ser un número mayor a 0");
      return;
    }

    // Validación de saldo pendiente SOLO para pagos nuevos parciales
    if (modoPago === "crear" && selectedOrden && selectedOrden.tipoPago === "parcial") {
      const saldo = selectedOrden.saldoPendiente ?? 0;
      if (montoNumber > saldo) {
        setErrorForm(
          `El monto no puede ser mayor al saldo pendiente ($${saldo}).`
        );
        return;
      }
    }

    try {
      setGuardando(true);
      setErrorForm(null);

      const payload = {
        monto: montoNumber,
        medio: form.medio.trim() || "Sin especificar",
        confirmado: form.confirmado,
        nota: form.nota.trim()
      };

      if (modoPago === "crear") {
        await registrarPago({
          clienteId: form.clienteId,
          ordenId: form.ordenId,
          ...payload,
          usuarioId: "admin_demo" // luego se reemplaza por el usuario logueado
        });
      } else if (modoPago === "editar" && pagoEditando) {
        setEditandoPagoId(pagoEditando.id);
        await editarPagoConRecalculo(pagoEditando.id, payload);
      }

      setOpenModal(false);
      setModoPago("crear");
      setPagoEditando(null);

      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorForm(
        modoPago === "crear"
          ? "Error al registrar el pago"
          : "Error al modificar el pago"
      );
    } finally {
      setGuardando(false);
      setEditandoPagoId(null);
    }
  }

  // =====================
  //   ACCIONES DE TABLA: EDITAR / ELIMINAR
  // =====================

  function handleEditarPagoDeCliente(pago) {
    setModoPago("editar");
    setPagoEditando(pago);
    setErrorForm(null);

    setForm({
      clienteId: pago.clienteId,
      ordenId: pago.ordenId,
      monto: String(pago.monto ?? ""),
      medio: pago.medio || "",
      confirmado: !!pago.confirmado,
      nota: pago.nota || ""
    });

    setOpenModal(true);
  }

  function handleEliminarPagoDeCliente(pago) {
    setPagoAEliminar(pago);
    setErrorDeletePago(null);
    setDeletePagoDialogOpen(true);
  }

  function handleCloseDeletePagoDialog() {
    if (eliminandoPagoId) return;
    setDeletePagoDialogOpen(false);
    setPagoAEliminar(null);
    setErrorDeletePago(null);
  }

  async function handleConfirmDeletePago() {
    if (!pagoAEliminar) return;

    try {
      setEliminandoPagoId(pagoAEliminar.id);
      setErrorDeletePago(null);

      await eliminarPagoConRecalculo(pagoAEliminar.id);
      await cargarDatos();

      setDeletePagoDialogOpen(false);
      setPagoAEliminar(null);
    } catch (err) {
      console.error(err);
      setErrorDeletePago("No se pudo eliminar el pago.");
    } finally {
      setEliminandoPagoId(null);
    }
  }

  // =====================
  //   RENDER
  // =====================

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap"
        }}
      >
        <Typography variant="h5">Pagos</Typography>
        <Button variant="contained" onClick={handleOpenModal}>
          Registrar pago
        </Button>
      </Box>

      {errorGlobal && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorGlobal}
        </Typography>
      )}

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <PagosTable
          pagos={pagos}
          clientesMap={clientesMap}
          ordenesMap={ordenesMap}
          showCliente={true} // 👈 en la página general sí mostramos la columna cliente
          onEditarPago={handleEditarPagoDeCliente}
          onEliminarPago={handleEliminarPagoDeCliente}
          editandoId={editandoPagoId}
          eliminandoId={eliminandoPagoId}
        />
      )}

      {/* Alta / edición de pago */}
      <PagoFormDialog
        open={openModal}
        onClose={handleCloseModal}
        clientes={clientes}
        ordenesCliente={ordenesCliente}
        selectedOrden={selectedOrden}
        form={form}
        onChange={handleFormChange}
        onConfirmadoChange={handleConfirmadoChange}
        onSubmit={handleFormSubmit}
        guardando={guardando}
        errorForm={errorForm}
        // en modo edición bloqueamos cliente + orden para que no los cambien
        lockClienteOrden={modoPago === "editar"}
      />

      {/* Confirmar eliminación de pago */}
      <ConfirmDialog
        open={deletePagoDialogOpen}
        onClose={handleCloseDeletePagoDialog}
        title="Eliminar pago"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar pago"
        loading={!!eliminandoPagoId}
        error={errorDeletePago}
        onConfirm={handleConfirmDeletePago}
      />
    </Box>
  );
}

export default PagosPage;
