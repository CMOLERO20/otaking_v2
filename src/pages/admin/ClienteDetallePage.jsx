// src/pages/admin/ClienteDetallePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Button
} from "@mui/material";
import { useParams, Link } from "react-router-dom";

import {
  obtenerCliente,
  actualizarCliente
} from "../../services/clientes";

import {
  listarOrdenesPorCliente,
  eliminarOrden
} from "../../services/ordenes";

import {
  listarPagosPorCliente,
  listarPagosPorOrden,
  registrarPago,
  editarPagoConRecalculo,
  eliminarPagoConRecalculo
} from "../../services/pagos";

import OrdenesTable from "../../components/ordenes/OrdenesTable";
import PagosTable from "../../components/pagos/PagosTable";
import ClienteOrdenesResumen from "../../components/clientes/ClienteOrdenesResumen";
import PagoFormDialog from "../../components/pagos/PagoFormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ClienteEditDialog from "../../components/clientes/ClienteEditDialog";

function ClienteDetallePage() {
  const { clienteId } = useParams();

  const [cliente, setCliente] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // ---- edición de cliente ----
  const [openEditCliente, setOpenEditCliente] = useState(false);
  const [guardandoEditCliente, setGuardandoEditCliente] = useState(false);
  const [errorEditCliente, setErrorEditCliente] = useState(null);

  // ---- registrar / editar pago ----
  const [openPago, setOpenPago] = useState(false);
  const [modoPago, setModoPago] = useState("crear"); // "crear" | "editar"
  const [pagoEditando, setPagoEditando] = useState(null);

  const [pagoForm, setPagoForm] = useState({
    clienteId: "",
    ordenId: "",
    monto: "",
    medio: "",
    confirmado: true,
    nota: ""
  });
  const [ordenesClientePago, setOrdenesClientePago] = useState([]);
  const [selectedOrdenPago, setSelectedOrdenPago] = useState(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [errorPagoForm, setErrorPagoForm] = useState(null);

  // ---- eliminar orden ----
  const [deleteOrdenDialogOpen, setDeleteOrdenDialogOpen] = useState(false);
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);
  const [eliminandoOrdenId, setEliminandoOrdenId] = useState(null);
  const [errorDeleteOrden, setErrorDeleteOrden] = useState(null);

  // ---- editar / eliminar pago ----
  const [editandoPagoId, setEditandoPagoId] = useState(null);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);
  const [deletePagoDialogOpen, setDeletePagoDialogOpen] = useState(false);
  const [eliminandoPagoId, setEliminandoPagoId] = useState(null);
  const [errorDeletePago, setErrorDeletePago] = useState(null);

  // ---- maps auxiliares ----
  const clientesMap = useMemo(() => {
    if (!cliente) return {};
    return { [cliente.id]: cliente.nombre };
  }, [cliente]);

  const ordenesMap = useMemo(() => {
    const map = {};
    ordenes.forEach((o) => {
      map[o.id] = o;
    });
    return map;
  }, [ordenes]);

  const resumenOrdenes = useMemo(() => {
    if (!ordenes || ordenes.length === 0) {
      return {
        total: 0,
        pagadas: 0,
        noPagadas: 0,
        totalAdeudado: 0
      };
    }

    const total = ordenes.length;
    const pagadas = ordenes.filter((o) => o.pagoCompleto === true).length;
    const noPagadas = total - pagadas;

    const totalAdeudado = ordenes.reduce((acc, o) => {
      const saldo = o.pagoCompleto === true ? 0 : (o.saldoPendiente || 0);
      return acc + saldo;
    }, 0);

    return { total, pagadas, noPagadas, totalAdeudado };
  }, [ordenes]);

  useEffect(() => {
    cargarDatosCliente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function cargarDatosCliente() {
    try {
      setCargando(true);
      const [clienteData, ordenesData, pagosData] = await Promise.all([
        obtenerCliente(clienteId),
        listarOrdenesPorCliente(clienteId),
        listarPagosPorCliente(clienteId)
      ]);
      setCliente(clienteData);
      setOrdenes(ordenesData);
      setPagos(pagosData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos del cliente");
    } finally {
      setCargando(false);
    }
  }

  // =======================
  //   EDITAR CLIENTE
  // =======================

  function handleCloseEditCliente() {
    if (guardandoEditCliente) return;
    setOpenEditCliente(false);
    setErrorEditCliente(null);
  }

  async function handleSaveEditCliente(dataActualizada) {
    if (!cliente) return;

    try {
      setGuardandoEditCliente(true);
      setErrorEditCliente(null);

      await actualizarCliente(cliente.id, dataActualizada);
      await cargarDatosCliente();
      setOpenEditCliente(false);
    } catch (err) {
      console.error(err);
      setErrorEditCliente("Error al guardar los datos del cliente");
    } finally {
      setGuardandoEditCliente(false);
    }
  }

  // =======================
  //   REGISTRAR / EDITAR PAGO
  // =======================

  function handleRegistrarPagoDesdeOrden(orden) {
    // modo crear
    setModoPago("crear");
    setPagoEditando(null);

    const ordenesDeCliente = ordenes.filter(
      (o) => o.clienteId === orden.clienteId
    );

    setOrdenesClientePago(ordenesDeCliente);
    setSelectedOrdenPago(orden);

    setPagoForm({
      clienteId,
      ordenId: orden.id,
      monto: "",
      medio: "",
      confirmado: true,
      nota: ""
    });

    setErrorPagoForm(null);
    setOpenPago(true);
  }

  function handleEditarPagoDeCliente(pago) {
    setModoPago("editar");
    setPagoEditando(pago);

    const ordenActual = ordenesMap[pago.ordenId] || null;
    const ordenesDeCliente = ordenes.filter(
      (o) => o.clienteId === pago.clienteId
    );

    setOrdenesClientePago(ordenesDeCliente);
    setSelectedOrdenPago(ordenActual);

    setPagoForm({
      clienteId: pago.clienteId,
      ordenId: pago.ordenId,
      monto: String(pago.monto ?? ""),
      medio: pago.medio || "",
      confirmado: !!pago.confirmado,
      nota: pago.nota || ""
    });

    setErrorPagoForm(null);
    setOpenPago(true);
  }

  function handlePagoChange(e) {
    const { name, value } = e.target;
    setPagoForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleConfirmadoChange(e) {
    const { checked } = e.target;
    setPagoForm((prev) => ({ ...prev, confirmado: checked }));
  }

  function handleClosePago() {
    if (guardandoPago) return;
    setOpenPago(false);
    setSelectedOrdenPago(null);
    setPagoEditando(null);
    setModoPago("crear");
    setErrorPagoForm(null);
  }

  async function handlePagoSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const montoNumber = Number(pagoForm.monto);
    if (!pagoForm.monto || Number.isNaN(montoNumber) || montoNumber <= 0) {
      setErrorPagoForm("El monto debe ser un número mayor a 0");
      return;
    }

    const ordenActual =
      ordenes.find((o) => o.id === pagoForm.ordenId) || selectedOrdenPago;

    if (!ordenActual) {
      setErrorPagoForm("No se encontró la orden seleccionada");
      return;
    }

    // Solo restringimos monto > saldo en modo "crear"
    if (modoPago === "crear") {
      const saldoActual =
        ordenActual.saldoPendiente ??
        (ordenActual.total - (ordenActual.totalPagado || 0));

      if (ordenActual.tipoPago === "parcial" && montoNumber > saldoActual) {
        setErrorPagoForm(
          `El monto no puede ser mayor al saldo pendiente ($${saldoActual}).`
        );
        return;
      }
    }

    try {
      setGuardandoPago(true);
      setErrorPagoForm(null);

      const payload = {
        monto: montoNumber,
        medio: pagoForm.medio.trim() || "Sin especificar",
        confirmado: pagoForm.confirmado,
        nota: pagoForm.nota.trim()
      };

      if (modoPago === "crear") {
        await registrarPago({
          ...payload,
          clienteId: pagoForm.clienteId,
          ordenId: pagoForm.ordenId,
          usuarioId: "admin_demo"
        });
      } else if (modoPago === "editar" && pagoEditando) {
        await editarPagoConRecalculo(pagoEditando.id, payload);
      }

      setOpenPago(false);
      setSelectedOrdenPago(null);
      setPagoEditando(null);
      setModoPago("crear");

      await cargarDatosCliente();
    } catch (err) {
      console.error(err);
      setErrorPagoForm(
        modoPago === "crear"
          ? "Error al registrar el pago"
          : "Error al modificar el pago"
      );
    } finally {
      setGuardandoPago(false);
    }
  }

  // =======================
  //   ELIMINAR ORDEN
  // =======================

  function handleEliminarOrdenClick(orden) {
    setOrdenAEliminar(orden);
    setErrorDeleteOrden(null);
    setDeleteOrdenDialogOpen(true);
  }

  function handleCloseDeleteOrdenDialog() {
    if (eliminandoOrdenId) return;
    setDeleteOrdenDialogOpen(false);
    setOrdenAEliminar(null);
    setErrorDeleteOrden(null);
  }

  async function handleConfirmDeleteOrden() {
    if (!ordenAEliminar) return;

    try {
      setEliminandoOrdenId(ordenAEliminar.id);
      setErrorDeleteOrden(null);

      const pagosOrden = await listarPagosPorOrden(ordenAEliminar.id);
      if (pagosOrden.length > 0) {
        setErrorDeleteOrden(
          "No se puede eliminar la orden porque ya tiene pagos registrados."
        );
        return;
      }

      const ordenActual = ordenes.find((o) => o.id === ordenAEliminar.id);
      if (
        !ordenActual ||
        ordenActual.pagoCompleto ||
        (ordenActual.totalPagado || 0) > 0
      ) {
        setErrorDeleteOrden(
          "Solo se pueden eliminar órdenes pendientes y sin pagos registrados."
        );
        return;
      }

      await eliminarOrden(ordenAEliminar.id);
      await cargarDatosCliente();
      setDeleteOrdenDialogOpen(false);
      setOrdenAEliminar(null);
    } catch (err) {
      console.error(err);
      setErrorDeleteOrden("Error al eliminar la orden.");
    } finally {
      setEliminandoOrdenId(null);
    }
  }

  // =======================
  //   ELIMINAR PAGO
  // =======================

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
      await cargarDatosCliente();

      setDeletePagoDialogOpen(false);
      setPagoAEliminar(null);
    } catch (err) {
      console.error(err);
      setErrorDeletePago("No se pudo eliminar el pago.");
    } finally {
      setEliminandoPagoId(null);
    }
  }

  // =======================
  //   RENDER
  // =======================

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !cliente) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">
          {error || "No se encontró el cliente"}
        </Typography>
        <Button
          component={Link}
          to="/admin/clientes"
          sx={{ mt: 2 }}
          variant="outlined"
        >
          Volver a clientes
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabecera con datos del cliente */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          flexWrap: "wrap"
        }}
      >
        <Box>
          <Typography variant="h5">{cliente.nombre}</Typography>
          <Typography variant="body2" color="text.secondary">
            {cliente.email} · {cliente.telefono}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => setOpenEditCliente(true)}
        >
          Editar datos
        </Button>
      </Box>

      {/* Resumen de órdenes del cliente */}
      <ClienteOrdenesResumen resumen={resumenOrdenes} />

      <Divider sx={{ my: 3 }} />

      {/* Órdenes del cliente */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Órdenes de este cliente
      </Typography>

      <OrdenesTable
        ordenes={ordenes}
        clientesMap={clientesMap}
        showCliente={false}
        showFecha={true}
        onRegistrarPago={handleRegistrarPagoDesdeOrden}
        onEliminarClick={handleEliminarOrdenClick}
        eliminandoId={eliminandoOrdenId}
      />

      <Divider sx={{ my: 3 }} />

      {/* Pagos del cliente */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Pagos de este cliente
      </Typography>

      <PagosTable
        pagos={pagos}
        clientesMap={clientesMap}
        ordenesMap={ordenesMap}
        showCliente={false}
        onEditarPago={handleEditarPagoDeCliente}
        onEliminarPago={handleEliminarPagoDeCliente}
        editandoId={editandoPagoId}
        eliminandoId={eliminandoPagoId}
      />

      {/* Dialog registrar / editar pago */}
      <PagoFormDialog
        open={openPago}
        onClose={handleClosePago}
        clientes={cliente ? [cliente] : []}
        ordenesCliente={ordenesClientePago}
        selectedOrden={selectedOrdenPago}
        form={pagoForm}
        onChange={handlePagoChange}
        onConfirmadoChange={handleConfirmadoChange}
        onSubmit={handlePagoSubmit}
        guardando={guardandoPago}
        errorForm={errorPagoForm}
        lockClienteOrden={true}
      />

      {/* Dialog editar cliente */}
      <ClienteEditDialog
        open={openEditCliente}
        onClose={handleCloseEditCliente}
        cliente={cliente}
        onSave={handleSaveEditCliente}
        guardando={guardandoEditCliente}
        error={errorEditCliente}
      />

      {/* Dialog confirmar eliminación de orden */}
      <ConfirmDialog
        open={deleteOrdenDialogOpen}
        onClose={handleCloseDeleteOrdenDialog}
        title={
          ordenAEliminar
            ? `Eliminar pedido ${ordenAEliminar.ordenCodigo || ""}`
            : "Eliminar orden"
        }
        description="Solo se pueden eliminar órdenes con estado pendiente y sin pagos asociados. Esta acción no se puede deshacer."
        confirmText="Eliminar orden"
        loading={!!eliminandoOrdenId}
        error={errorDeleteOrden}
        onConfirm={handleConfirmDeleteOrden}
      />

      {/* Dialog confirmar eliminación de pago */}
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

export default ClienteDetallePage;
