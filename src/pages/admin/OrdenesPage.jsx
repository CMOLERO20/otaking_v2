// src/pages/admin/OrdenesPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button
} from "@mui/material";
import { listarClientes } from "../../services/clientes";
import { crearOrden, listarOrdenes, eliminarOrden } from "../../services/ordenes";
import {
  registrarPago,
  listarPagosPorOrden
} from "../../services/pagos";
import OrdenesTable from "../../components/ordenes/OrdenesTable";
import OrdenFormDialog from "../../components/ordenes/OrdenFormDialog";
import ClienteOrdenesResumen from "../../components/clientes/ClienteOrdenesResumen";
import PagoFormDialog from "../../components/pagos/PagoFormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";

function OrdenesPage() {
  const [clientes, setClientes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);

  // crear orden
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    clienteId: "",
    concepto: "",
    total: "",
    tipoPago: "unico",
    totalCuotasPlaneadas: "",
    fechaSalida: "",
    esPreventa: false,
    primeraCuotaVencimiento: ""  
  });
  const [errorForm, setErrorForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // registrar pago desde tabla
  const [openPago, setOpenPago] = useState(false);
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

  // eliminar orden
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);

  const clientesMap = useMemo(() => {
    const map = {};
    clientes.forEach((c) => {
      map[c.id] = c.nombre;
    });
    return map;
  }, [clientes]);

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
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      const [clientesData, ordenesData] = await Promise.all([
        listarClientes({ soloActivos: false }),
        listarOrdenes()
      ]);
      setClientes(clientesData);
      setOrdenes(ordenesData);
      setErrorGlobal(null);
    } catch (err) {
      console.error(err);
      setErrorGlobal("Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }

  // ---- CREAR ORDEN ----
  function handleOpenModal() {
    setErrorForm(null);
    setForm({
      clienteId: "",
      concepto: "",
      total: "",
      tipoPago: "unico",
      totalCuotasPlaneadas: "",
      fechaSalida: "",
      esPreventa: false
    });
    setOpenModal(true);
  }

  function handleCloseModal() {
    if (guardando) return;
    setOpenModal(false);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePreventaChange(e) {
    const { checked } = e.target;
    setForm((prev) => ({
      ...prev,
      esPreventa: checked,
      fechaSalida: checked ? prev.fechaSalida : ""
    }));
  }

  async function handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!form.clienteId) {
      setErrorForm("Tenés que seleccionar un cliente");
      return;
    }
    if (!form.concepto.trim()) {
      setErrorForm("El concepto es obligatorio");
      return;
    }
    if (!form.total) {
      setErrorForm("El total es obligatorio");
      return;
    }

    const totalNumber = Number(form.total);
    if (Number.isNaN(totalNumber) || totalNumber <= 0) {
      setErrorForm("El total debe ser un número mayor a 0");
      return;
    }

    let totalCuotasNumber = undefined;
    if (form.tipoPago === "cuotas") {
      if (!form.totalCuotasPlaneadas) {
        setErrorForm("Indicá la cantidad de cuotas");
        return;
      }
      totalCuotasNumber = Number(form.totalCuotasPlaneadas);
      if (Number.isNaN(totalCuotasNumber) || totalCuotasNumber <= 0) {
        setErrorForm("La cantidad de cuotas debe ser un número mayor a 0");
        return;
      }
    }

    if (form.esPreventa && !form.fechaSalida) {
      setErrorForm("La fecha de salida es obligatoria para preventa");
      return;
    }

    try {
      setGuardando(true);
      setErrorForm(null);

      let fechaSalidaDate = undefined;
      if (form.esPreventa && form.fechaSalida) {
        fechaSalidaDate = new Date(form.fechaSalida + "T00:00:00");
      }

      await crearOrden({
        clienteId: form.clienteId,
        concepto: form.concepto.trim(),
        total: totalNumber,
        tipoPago: form.tipoPago,
        totalCuotasPlaneadas: totalCuotasNumber,
        fechaSalida: fechaSalidaDate,
        esPreventa: form.esPreventa,
         primeraCuotaVencimiento:
      form.tipoPago === "cuotas" && form.primeraCuotaVencimiento
        ? form.primeraCuotaVencimiento   // 👈 string YYYY-MM-DD
        : null,
        usuarioId: "admin_demo"
      });

      setOpenModal(false);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorForm("Error al crear la orden");
    } finally {
      setGuardando(false);
    }
  }

  // ---- REGISTRAR PAGO DESDE TABLA ----
  function handleRegistrarPagoDesdeOrden(orden) {
    const ordenesDeCliente = ordenes.filter(
      (o) => o.clienteId === orden.clienteId
    );

    setOrdenesClientePago(ordenesDeCliente);
    setSelectedOrdenPago(orden);

    setPagoForm({
      clienteId: orden.clienteId,
      ordenId: orden.id,
      monto: "",
      medio: "",
      confirmado: true,
      nota: ""
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

    const saldoActual =
      ordenActual.saldoPendiente ??
      (ordenActual.total - (ordenActual.totalPagado || 0));

    if (ordenActual.tipoPago === "parcial" && montoNumber > saldoActual) {
      setErrorPagoForm(
        `El monto no puede ser mayor al saldo pendiente ($${saldoActual}).`
      );
      return;
    }

    try {
      setGuardandoPago(true);
      setErrorPagoForm(null);

      await registrarPago({
        clienteId: pagoForm.clienteId,
        ordenId: pagoForm.ordenId,
        monto: montoNumber,
        medio: pagoForm.medio.trim() || "Sin especificar",
        confirmado: pagoForm.confirmado,
        nota: pagoForm.nota.trim(),
        usuarioId: "admin_demo"
      });

      setOpenPago(false);
      setSelectedOrdenPago(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorPagoForm("Error al registrar el pago");
    } finally {
      setGuardandoPago(false);
    }
  }

  // ---- ELIMINAR ORDEN ----
  function handleEliminarClick(orden) {
    setOrdenAEliminar(orden);
    setErrorDelete(null);
    setDeleteDialogOpen(true);
  }

  function handleCloseDeleteDialog() {
    if (eliminandoId) return;
    setDeleteDialogOpen(false);
    setOrdenAEliminar(null);
    setErrorDelete(null);
  }

  async function handleConfirmDelete() {
    if (!ordenAEliminar) return;

    try {
      setEliminandoId(ordenAEliminar.id);
      setErrorDelete(null);

      // seguridad extra: verificar pagos asociados
      const pagos = await listarPagosPorOrden(ordenAEliminar.id);
      if (pagos.length > 0) {
        setErrorDelete(
          "No se puede eliminar la orden porque ya tiene pagos registrados."
        );
        return;
      }

      // también chequear estado pendiente / sin pagos en datos actuales
      const ordenActual = ordenes.find((o) => o.id === ordenAEliminar.id);
      if (
        !ordenActual ||
        ordenActual.pagoCompleto ||
        (ordenActual.totalPagado || 0) > 0
      ) {
        setErrorDelete(
          "Solo se pueden eliminar órdenes pendientes y sin pagos registrados."
        );
        return;
      }

      await eliminarOrden(ordenAEliminar.id);
      await cargarDatos();
      setDeleteDialogOpen(false);
      setOrdenAEliminar(null);
    } catch (err) {
      console.error(err);
      setErrorDelete("Error al eliminar la orden.");
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <Box>
      {/* Título + botón */}
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
        <Typography variant="h5">Pedidos</Typography>
        <Button variant="contained" onClick={handleOpenModal}>
          Nuevo pedido
        </Button>
      </Box>

      {/* Resumen visual */}
      <ClienteOrdenesResumen resumen={resumenOrdenes} />

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
        <OrdenesTable
          ordenes={ordenes}
          clientesMap={clientesMap}
          showCliente={true}
          showFecha={true}
          onRegistrarPago={handleRegistrarPagoDesdeOrden}
          onEliminarClick={handleEliminarClick}
          eliminandoId={eliminandoId}
        />
      )}

      {/* Dialog crear orden */}
      <OrdenFormDialog
        open={openModal}
        onClose={handleCloseModal}
        clientes={clientes}
        form={form}
        onChange={handleFormChange}
        onPreventaChange={handlePreventaChange}
        onSubmit={handleFormSubmit}
        guardando={guardando}
        errorForm={errorForm}
      />

      {/* Dialog registrar pago */}
      <PagoFormDialog
        open={openPago}
        onClose={handleClosePago}
        clientes={clientes}
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

      {/* Dialog confirmar eliminación */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title={
          ordenAEliminar
            ? `Eliminar pedido ${ordenAEliminar.ordenCodigo || ""}`
            : "Eliminar orden"
        }
        description="Solo se pueden eliminar órdenes con estado pendiente y sin pagos asociados. Esta acción no se puede deshacer."
        confirmText="Eliminar orden"
        loading={!!eliminandoId}
        error={errorDelete}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

export default OrdenesPage;
