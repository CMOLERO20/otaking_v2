// src/components/ordenes/OrdenFormDialog.jsx
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

const TIPOS_PAGO = [
  { value: "unico", label: "Pago único" },
  { value: "cuotas", label: "Cuotas" },
  { value: "parcial", label: "Pagos parciales" }
];

function OrdenFormDialog({
  open,
  onClose,
  clientes,
  form,
  onChange,
  onPreventaChange,
  onSubmit,
  guardando,
  errorForm
}) {
  // cálculo del monto de la cuota (solo visual)
  const montoCuota = useMemo(() => {
    if (form.tipoPago !== "cuotas") return null;
    const total = Number(form.total);
    const cant = Number(form.totalCuotasPlaneadas);
    if (!total || !cant || Number.isNaN(total) || Number.isNaN(cant)) {
      return null;
    }
    return total / cant;
  }, [form.tipoPago, form.total, form.totalCuotasPlaneadas]);

  return (
    <Dialog
      open={open}
      onClose={guardando ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Nueva orden</DialogTitle>
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
                onChange={onChange}
              >
                {clientes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre} — {c.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Concepto y total */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Concepto"
                name="concepto"
                value={form.concepto}
                onChange={onChange}
                size="small"
                fullWidth
              />
              <TextField
                label="Total"
                name="total"
                value={form.total}
                onChange={onChange}
                size="small"
                type="number"
                sx={{ minWidth: 160 }}
              />
            </Stack>

            {/* Tipo de pago / cuotas / preventa */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {/* Tipo de pago */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="tipoPago-label">Tipo de pago</InputLabel>
                <Select
                  labelId="tipoPago-label"
                  label="Tipo de pago"
                  name="tipoPago"
                  value={form.tipoPago}
                  onChange={onChange}
                >
                  {TIPOS_PAGO.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Config de cuotas */}
              {form.tipoPago === "cuotas" && (
                <Stack spacing={1} sx={{ minWidth: 240 }}>
                  <TextField
                    label="Cantidad de cuotas"
                    name="totalCuotasPlaneadas"
                    value={form.totalCuotasPlaneadas}
                    onChange={onChange}
                    size="small"
                    type="number"
                  />

                  {montoCuota && (
                    <Typography variant="body2">
                      Monto por cuota: ${montoCuota.toFixed(2)}
                    </Typography>
                  )}

                  <TextField
                    label="Primera fecha de vencimiento"
                    name="primeraCuotaVencimiento"
                    value={form.primeraCuotaVencimiento || ""}
                    onChange={onChange}
                    size="small"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />

                  <Typography variant="caption" color="text.secondary">
                    Las siguientes cuotas vencerán el mismo día en los meses siguientes.
                  </Typography>
                </Stack>
              )}

              {/* Preventa */}
              <Stack spacing={1} sx={{ minWidth: 220 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.esPreventa}
                      onChange={onPreventaChange}
                    />
                  }
                  label="Es preventa"
                />
                <TextField
                  label="Fecha de salida"
                  name="fechaSalida"
                  value={form.fechaSalida}
                  onChange={onChange}
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 180 }}
                  disabled={!form.esPreventa}
                />
              </Stack>
            </Stack>

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
          {guardando ? "Guardando..." : "Crear orden"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default OrdenFormDialog;
