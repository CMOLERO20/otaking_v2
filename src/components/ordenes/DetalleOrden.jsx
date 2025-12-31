import { Typography, Paper, Box, Chip, Divider, Stack } from "@mui/material";
import { Link } from "react-router-dom";

// Helper para el chip de estado de pago
const getEstadoPagoChip = (orden) => {
  const getDate = (v) => {
    if (!v) return null;
    if (v?.seconds) return new Date(v.seconds * 1000); // Firestore Timestamp
    return new Date(v);
  };

  const fechaVto = getDate(orden.proximaCuotaVencimiento);
  const hoy = new Date();
  const estaVencida = !orden.pagoCompleto && fechaVto && fechaVto < hoy;

  if (orden.pagoCompleto) {
    return (
      <Chip
        label="Completo"
        color="success"
        size="small"
        variant="filled"
      />
    );
  }

  if (estaVencida) {
    return (
      <Chip
        label="Vencida"
        color="error"
        size="small"
        variant="filled"
      />
    );
  }

  return (
    <Chip
      label="Pendiente"
      color="warning"
      size="small"
      variant="filled"
    />
  );
};

function DetalleOrden({ orden, cliente, tituloOrden, formatDate, formatDateTime }) {
  return (
    <>
     

      {/* Info principal de la orden */}
      <Paper sx={{ p: 2, mb: 3 }}>
        {/* Encabezado de sección + estado de pago destacado */}
        

        {/* Detalles en formato filas */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Cliente:</Typography>
            <Typography>
              {cliente ? (
                <Link to={`/admin/clientes/${cliente.id}`}>
                  {cliente.nombre}
                </Link>
              ) : (
                orden.clienteId
              )}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Concepto:</Typography>
            <Typography>{orden.concepto}</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Total:</Typography>
            <Typography>${orden.total}</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Tipo de pago:</Typography>
            <Typography>{orden.tipoPago}</Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontWeight: 600 }}>Estado de pago:</Typography>
            {getEstadoPagoChip(orden)}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Total pagado:</Typography>
            <Typography>${orden.totalPagado || 0}</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Saldo pendiente:</Typography>
            <Typography>${orden.saldoPendiente || 0}</Typography>
          </Stack>

          {orden.tipoPago === "cuotas" && (
            <Stack direction="row" spacing={1}>
              <Typography sx={{ fontWeight: 600 }}>Cuotas:</Typography>
              <Typography>
                {orden.cuotasPagadas ?? 0} pagadas /{" "}
                {orden.totalCuotasPlaneadas ?? "-"} totales
                {orden.cuotasPendientes != null &&
                  ` (${orden.cuotasPendientes} pendientes)`}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Próximo vencimiento:</Typography>
            <Typography>
              {orden.proximaCuotaVencimiento
                ? formatDate(orden.proximaCuotaVencimiento)
                : "-"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Preventa:</Typography>
            <Typography>{orden.esPreventa ? "Sí" : "No"}</Typography>
          </Stack>

          {orden.esPreventa && orden.fechaSalida && (
            <Stack direction="row" spacing={1}>
              <Typography sx={{ fontWeight: 600 }}>Fecha de salida:</Typography>
              <Typography>{formatDate(orden.fechaSalida)}</Typography>
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>Creada:</Typography>
            <Typography>{formatDateTime(orden.createdAt)}</Typography>
          </Stack>

          {orden.updatedAt && (
            <Stack direction="row" spacing={1}>
              <Typography sx={{ fontWeight: 600 }}>
                Última actualización:
              </Typography>
              <Typography>{formatDateTime(orden.updatedAt)}</Typography>
            </Stack>
          )}
        </Box>
      </Paper>
    </>
  );
}

export default DetalleOrden;
