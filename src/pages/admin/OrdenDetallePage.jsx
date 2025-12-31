// src/pages/admin/OrdenDetallePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Button
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { obtenerOrden } from "../../services/ordenes";
import { obtenerCliente } from "../../services/clientes";
import { listarPagosPorOrden } from "../../services/pagos";
import PagosTable from "../../components/pagos/PagosTable";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DetalleOrden from "../../components/ordenes/DetalleOrden";


function formatDate(ts) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(d);
}

function formatDateTime(ts) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

function OrdenDetallePage() {
  const navigate = useNavigate();
  const { ordenId } = useParams();

  const [orden, setOrden] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const clientesMap = useMemo(() => {
    if (!cliente) return {};
    return { [cliente.id]: cliente.nombre };
  }, [cliente]);

  const ordenesMap = useMemo(() => {
    if (!orden) return {};
    return { [orden.id]: orden };
  }, [orden]);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const ordenData = await obtenerOrden(ordenId);

        if (!ordenData) {
          setError("La orden no existe");
          setCargando(false);
          return;
        }

        setOrden(ordenData);

        const [clienteData, pagosData] = await Promise.all([
          obtenerCliente(ordenData.clienteId),
          listarPagosPorOrden(ordenId)
        ]);

        setCliente(clienteData || null);
        setPagos(pagosData);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error al cargar la orden");
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [ordenId]);

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2 }}  component="div"  >
        {error}
      </Typography>
    );
  }

  if (!orden) {
    return (
      <Typography sx={{ mt: 2 }}  component="div"  >
        No se encontró información de la orden.
      </Typography>
    );
  }

  const tituloOrden = orden.ordenCodigo || `PD-${orden.id.slice(0, 6).toUpperCase()}`;

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
  <Typography variant="h5">
    Detalle de la orden {orden?.ordenCodigo || ""}
  </Typography>

 <Button
  variant="outlined"
  startIcon={<ArrowBackIcon />}
  onClick={() => navigate(-1)}
>
  Volver
</Button>

</Box>

       <DetalleOrden
         orden={orden}
         cliente={cliente}
         tituloOrden={tituloOrden}
         formatDate={formatDate}
         formatDateTime={formatDateTime}
       />

      {/* Historial (si existe) */}
      {Array.isArray(orden.historial) && orden.historial.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Historial de la orden
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {orden.historial.map((item, index) => (
              <Typography key={index} variant="body2">
                <strong>{formatDateTime(item.fecha)}:</strong>{" "}
                {item.detalle}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Pagos de esta orden */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Pagos de esta orden
        </Typography>

        <PagosTable
          pagos={pagos}
          clientesMap={clientesMap}
          ordenesMap={ordenesMap}
           showCliente={false}
        />
      </Box>
    </Box>
  );
}

export default OrdenDetallePage;
