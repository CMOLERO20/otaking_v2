// src/components/ordenes/OrdenesTable.jsx
import React, { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Box,
  TextField,
} from "@mui/material";
import { Link } from "react-router-dom";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";

function formatDate(ts) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Props:
 *  - ordenes
 *  - clientesMap
 *  - showCliente
 *  - showFecha
 *  - onRegistrarPago?(orden)
 *  - onEliminarClick?(orden)
 *  - eliminandoId?  // id que se está eliminando (para deshabilitar botón)
 */
function OrdenesTable({
  ordenes,
  clientesMap = {},
  showCliente = true,
  showFecha = true,
  onRegistrarPago,
  onEliminarClick,
  eliminandoId,
}) {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // 🔎 Filtros
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  if (!ordenes || ordenes.length === 0) {
    return <Typography>No hay órdenes creadas.</Typography>;
  }

  // Cuando cambian filtros o la lista, volvemos a la primera página
  useEffect(() => {
    setPage(0);
  }, [search, fechaDesde, fechaHasta, ordenes]);

  // 🧠 Lógica de filtrado
  const filteredOrdenes = ordenes.filter((o) => {
    // createdAt puede ser Firestore Timestamp o algo parseable por Date
    const created = o.createdAt?.toDate
      ? o.createdAt.toDate()
      : o.createdAt
      ? new Date(o.createdAt)
      : null;

    // --- FILTRO POR RANGO DE FECHAS ---
    if (fechaDesde) {
      const from = new Date(fechaDesde);
      from.setHours(0, 0, 0, 0);
      if (!created || created < from) return false;
    }

    if (fechaHasta) {
      const to = new Date(fechaHasta);
      to.setHours(23, 59, 59, 999);
      if (!created || created > to) return false;
    }

    // --- BUSCADOR GLOBAL ---
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const codigoPedido = (
      o.ordenCodigo || `PD-${o.id.slice(0, 6).toUpperCase()}`
    ).toLowerCase();

    const concepto = (o.concepto || "").toLowerCase();
    const clienteNombre = (
      clientesMap[o.clienteId] || o.clienteId || ""
    ).toLowerCase();

    const matches =
      codigoPedido.includes(term) ||
      concepto.includes(term) ||
      clienteNombre.includes(term);

    return matches;
  });

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  // 📄 Paginación sobre el resultado filtrado
  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filteredOrdenes.slice(start, end);

  return (
    <Paper>
      {/* 🔎 Barra de filtros */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          label="Buscar por pedido / concepto / cliente"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {showFecha && (
          <>
            <TextField
              label="Fecha desde"
              type="date"
              size="small"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha hasta"
              type="date"
              size="small"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>N° Pedido</TableCell>
              {showFecha && <TableCell>Fecha</TableCell>}
              {showCliente && <TableCell>Cliente</TableCell>}
              <TableCell>Concepto</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Tipo pago</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Pagado</TableCell>
              <TableCell>Saldo</TableCell>
              <TableCell>Cuotas</TableCell>
              <TableCell>Cuotas pendientes</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((o) => {
              // regla de negocio: solo pendiente y sin pagos
              const puedeEliminar =
                !o.pagoCompleto && (o.totalPagado || 0) === 0;

              return (
                <TableRow key={o.id}>
                  {/* N° Pedido */}
                  <TableCell>
                    {o.ordenCodigo || `PD-${o.id.slice(0, 6).toUpperCase()}`}
                  </TableCell>

                  {showFecha && (
                    <TableCell>{formatDate(o.createdAt)}</TableCell>
                  )}

                  {showCliente && (
                    <TableCell>
                      {clientesMap[o.clienteId] || o.clienteId}
                    </TableCell>
                  )}

                  <TableCell>{o.concepto}</TableCell>
                  <TableCell>{o.total}</TableCell>
                  <TableCell>{o.tipoPago}</TableCell>

                  <TableCell>
  {(() => {
    const getDate = (v) => {
      if (!v) return null;
      if (v?.seconds) return new Date(v.seconds * 1000); // Firestore Timestamp
      return new Date(v);
    };

    const fechaVto = getDate(o.proximaCuotaVencimiento);
    const hoy = new Date();

    const estaVencida =
      !o.pagoCompleto && fechaVto && fechaVto < hoy;

    if (o.pagoCompleto) {
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
  })()}
</TableCell>


                  <TableCell>{o.totalPagado}</TableCell>
                  <TableCell>{o.saldoPendiente}</TableCell>
                  <TableCell>
                    {o.totalCuotasPlaneadas != null
                      ? o.totalCuotasPlaneadas
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {o.cuotasPendientes != null ? o.cuotasPendientes : "-"}
                  </TableCell>

                  <TableCell align="right">
                    {/* Registrar pago */}
                    {onRegistrarPago && (
                      <Tooltip title="Registrar pago">
                        <span>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onRegistrarPago(o)}
                            disabled={o.pagoCompleto === true}
                          >
                            <AttachMoneyIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}

                    {/* Ver detalle */}
                    <Tooltip title="Ver detalle">
                      <IconButton
                        size="small"
                        color="primary"
                        component={Link}
                        to={`/admin/ordenes/${o.id}`}
                      >
                        <AddCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Eliminar orden */}
                    {onEliminarClick && (
                      <Tooltip title="Eliminar orden">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onEliminarClick(o)}
                            disabled={!puedeEliminar || eliminandoId === o.id}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Si quisieras, podrías agregar acá una fila de "Sin resultados" cuando filteredOrdenes.length === 0 */}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        rowsPerPageOptions={[10]}
        count={filteredOrdenes.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
      />
    </Paper>
  );
}

export default OrdenesTable;
