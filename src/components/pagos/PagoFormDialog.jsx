// src/components/pagos/PagoFormDialog.jsx
import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Button
} from "@mui/material";

function PagoFormDialog({
  open,
  onClose,
  clientes,
  ordenesCliente,
  selectedOrden,
  form,
  onChange,
  onConfirmadoChange,
  onSubmit,
  guardando,
  errorForm,
  lockClienteOrden = false // 👈 NUEVO (default false)
}) {
  const esCuotas = selectedOrden?.tipoPago === "cuotas";
  const esParcial = selectedOrden?.tipoPago === "parcial";

  const montoCuota = useMemo(() => {
    if (!esCuotas || !selectedOrden?.montoCuotaCalculado) return null;
    return selectedOrden.montoCuotaCalculado;
  }, [esCuotas, selectedOrden]);

  const proximaCuotaNumero = useMemo(() => {
    if (!esCuotas) return null;
    const pagadas = selectedOrden?.cuotasPagadas || 0;
    const total = selectedOrden?.totalCuotasPlaneadas || null;
    if (!total) return pagadas + 1;
    return Math.min(pagadas + 1, total);
  }, [esCuotas, selectedOrden]);

  const saldoPendiente = selectedOrden?.saldoPendiente ?? null;

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Registrar pago</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ mt: 1 }}
          noValidate
          autoComplete="off"
        >
          <Stack spacing={2} sx={{ mb: 2 }}>
            {/* Cliente */}
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="cliente-label">Cliente</InputLabel>
              <Select
                labelId="cliente-label"
                label="Cliente"
                name="clienteId"
                value={form.clienteId}
                onChange={lockClienteOrden ? undefined : onChange}
                disabled={lockClienteOrden}
              >
                {clientes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre} — {c.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Orden */}
            <FormControl
              size="small"
              sx={{ minWidth: 260 }}
              disabled={lockClienteOrden || !form.clienteId}
            >
              <InputLabel id="orden-label">Orden</InputLabel>
              <Select
                labelId="orden-label"
                label="Orden"
                name="ordenId"
                value={form.ordenId}
                onChange={lockClienteOrden ? undefined : onChange}
              >
                {ordenesCliente.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                   {o.ordenCodigo} {o.concepto} — ${o.total} 
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Info de la orden seleccionada */}
            {selectedOrden && (
              <Typography variant="body2">
                Tipo de pago: <strong>{selectedOrden.tipoPago}</strong>
                {esCuotas &&
                  selectedOrden.totalCuotasPlaneadas &&
                  ` — ${selectedOrden.cuotasPagadas ?? 0} pagadas / ${
                    selectedOrden.totalCuotasPlaneadas
                  } totales`}
                {esParcial && saldoPendiente != null &&
                  ` — Saldo pendiente: $${saldoPendiente}`}
              </Typography>
            )}

            {/* Monto y medio */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Monto"
                name="monto"
                value={form.monto}
                onChange={onChange}
                size="small"
                type="number"
                sx={{ minWidth: 160 }}
              />
              <TextField
                label="Medio de pago"
                name="medio"
                value={form.medio}
                onChange={onChange}
                size="small"
                sx={{ minWidth: 200 }}
                placeholder="Efectivo, transferencia, etc."
              />
            </Stack>

            {/* Confirmado + info de cuota o saldo */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.confirmado}
                    onChange={onConfirmadoChange}
                  />
                }
                label="Pago confirmado"
              />

              {esCuotas && (
                <Stack spacing={1}>
                  {proximaCuotaNumero && (
                    <Typography variant="body2">
                      Este pago se imputará a la cuota{" "}
                      <strong>{proximaCuotaNumero}</strong>
                      {selectedOrden?.totalCuotasPlaneadas &&
                        ` de ${selectedOrden.totalCuotasPlaneadas}`}
                    </Typography>
                  )}
                  {montoCuota && (
                    <Typography variant="body2">
                      Monto de referencia por cuota: ${montoCuota.toFixed(2)}
                    </Typography>
                  )}
                </Stack>
              )}

              {esParcial && saldoPendiente != null && (
                <Typography variant="body2">
                  Saldo pendiente actual: <strong>${saldoPendiente}</strong>
                </Typography>
              )}
            </Stack>

            {/* Nota opcional */}
            <TextField
              label="Nota interna (opcional)"
              name="nota"
              value={form.nota}
              onChange={onChange}
              size="small"
              multiline
              minRows={2}
            />

            {errorForm && (
              <Typography color="error" variant="body2">
                {errorForm}
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Registrar pago"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PagoFormDialog;
