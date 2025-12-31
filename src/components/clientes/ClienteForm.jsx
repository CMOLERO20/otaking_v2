// src/components/clientes/ClienteForm.jsx
import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack
} from "@mui/material";

function ClienteForm({ form, onChange, onSubmit, guardando, error }) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ mb: 3 }}
      noValidate
      autoComplete="off"
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Agregar nuevo cliente
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap" }}>
        <TextField
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          size="small"
          required
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          size="small"
          required
        />
        <TextField
          label="Teléfono"
          name="telefono"
          value={form.telefono}
          onChange={onChange}
          size="small"
        />
        <TextField
          label="Observaciones"
          name="observaciones"
          value={form.observaciones}
          onChange={onChange}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={guardando}
          sx={{ alignSelf: "center" }}
        >
          {guardando ? "Guardando..." : "Agregar"}
        </Button>
      </Stack>

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default ClienteForm;
