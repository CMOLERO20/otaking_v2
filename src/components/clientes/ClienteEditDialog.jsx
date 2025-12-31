// src/components/clientes/ClienteEditDialog.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  TextField,
  Typography,
  Button,
  FormControlLabel,
  Checkbox
} from "@mui/material";

function ClienteEditDialog({
  open,
  onClose,
  cliente,
  onSave,
  guardando,
  error
}) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    observaciones: "",
    activo: true
  });

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || "",
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        observaciones: cliente.observaciones || "",
        activo: cliente.activo !== false
      });
    }
  }, [cliente]);

  if (!cliente) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleActivoChange(e) {
    const { checked } = e.target;
    setForm((prev) => ({ ...prev, activo: checked }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar cliente</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 1 }}
          noValidate
          autoComplete="off"
        >
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              size="small"
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              size="small"
              fullWidth
              required
            />
            <TextField
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              size="small"
              fullWidth
            />
            <TextField
              label="Observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              size="small"
              fullWidth
              multiline
              minRows={2}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.activo}
                  onChange={handleActivoChange}
                />
              }
              label="Cliente activo"
            />

            {error && (
              <Typography color="error" variant="body2">
                {error}
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
          onClick={handleSubmit}
          variant="contained"
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ClienteEditDialog;
