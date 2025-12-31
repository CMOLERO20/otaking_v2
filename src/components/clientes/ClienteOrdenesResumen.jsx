// src/components/clientes/ClienteOrdenesResumen.jsx
import React from "react";
import { Paper, Box, Typography, LinearProgress } from "@mui/material";

function ClienteOrdenesResumen({ resumen }) {
  const porcentajePagadas =
    resumen.total === 0
      ? 0
      : (resumen.pagadas / resumen.total) * 100;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        Resumen
      </Typography>

      {/* Fila de stats */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          rowGap: 1.5
        }}
      >
        {/* Total órdenes */}
        <Box
          sx={{
            flex: "1 1 140px",
            p: 1.2,
            borderRadius: 1,
            bgcolor: "grey.100"
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Pedidos totales
          </Typography>
          <Typography variant="h6">
            {resumen.total}
          </Typography>
        </Box>

        {/* Pagadas completas */}
        <Box
          sx={{
            flex: "1 1 140px",
            p: 1.2,
            borderRadius: 1,
            bgcolor: "success.light",
            color: "success.contrastText"
          }}
        >
          <Typography variant="caption">
            Pagadas
          </Typography>
          <Typography variant="h6">
            {resumen.pagadas}
          </Typography>
        </Box>

        {/* Con saldo pendiente */}
        <Box
          sx={{
            flex: "1 1 160px",
            p: 1.2,
            borderRadius: 1,
            bgcolor: "warning.light",
            color: "warning.contrastText"
          }}
        >
          <Typography variant="caption">
            Con saldo pendiente
          </Typography>
          <Typography variant="h6">
            {resumen.noPagadas}
          </Typography>
        </Box>

        {/* Total adeudado */}
        <Box
          sx={{
            flex: "1 1 180px",
            p: 1.2,
            borderRadius: 1,
            bgcolor:
              resumen.totalAdeudado > 0
                ? "error.light"
                : "grey.100",
            color:
              resumen.totalAdeudado > 0
                ? "error.contrastText"
                : "text.primary"
          }}
        >
          <Typography variant="caption">
            Total adeudado
          </Typography>
          <Typography variant="h6">
            ${resumen.totalAdeudado}
          </Typography>
        </Box>
      </Box>

      {/* Progreso de pago */}
      <Box sx={{ mt: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 0.5 }}
        >
          Progreso de pagos
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={porcentajePagadas}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {Math.round(porcentajePagadas)}%
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default ClienteOrdenesResumen;
