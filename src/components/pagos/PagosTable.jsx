// src/components/pagos/PagosTable.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Typography,
  Box,
  TextField,
  Stack,
  Button,
  IconButton,
  Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";

function formatDate(ts) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(d);
}

/**
 * Props:
 *  - pagos: array de pagos
 *  - clientesMap: { [clienteId]: nombre }
 *  - ordenesMap: { [ordenId]: ordenCompleta }
 *  - showCliente?: boolean (default true)
 *  - onEditarPago?(pago)
 *  - onEliminarPago?(pago)
 *  - editandoId?: string   // opcional, para deshabilitar botón mientras se edita
 *  - eliminandoId?: string // opcional, para deshabilitar botón mientras se elimina
 */
function PagosTable({
  pagos,
  clientesMap = {},
  ordenesMap = {},
  showCliente = true,
  onEditarPago,
  onEliminarPago,
  editandoId,
  eliminandoId
}) {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Cuando cambian filtros, volvemos a la página 0
  useEffect(() => {
    setPage(0);
  }, [search, fechaDesde, fechaHasta]);

  const filteredPagos = useMemo(() => {
    if (!pagos) return [];

    let resultado = [...pagos];

    // ---- filtro texto: cliente o nro de pedido ----
    const term = search.trim().toLowerCase();
    if (term) {
      resultado = resultado.filter((p) => {
        const clienteNombre =
          clientesMap[p.clienteId] ||
          p.clienteNombre ||
          "";
        const orden = ordenesMap[p.ordenId];
        const codigoOrden =
          orden?.ordenCodigo ||
          p.ordenCodigo ||
          "";

        return (
          clienteNombre.toLowerCase().includes(term) ||
          codigoOrden.toLowerCase().includes(term)
        );
      });
    }

    // ---- filtro por fecha ----
    if (fechaDesde) {
      const desde = new Date(fechaDesde + "T00:00:00");
      resultado = resultado.filter((p) => {
        const d = p.createdAt?.toDate?.();
        if (!d) return false;
        return d >= desde;
      });
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta + "T23:59:59");
      resultado = resultado.filter((p) => {
        const d = p.createdAt?.toDate?.();
        if (!d) return false;
        return d <= hasta;
      });
    }

    return resultado;
  }, [pagos, clientesMap, ordenesMap, search, fechaDesde, fechaHasta]);

  const totalMonto = useMemo(() => {
    if (!filteredPagos || filteredPagos.length === 0) return 0;
    return filteredPagos.reduce((acc, p) => acc + (p.monto || 0), 0);
  }, [filteredPagos]);

  if (!pagos || pagos.length === 0) {
    return <Typography>No hay pagos registrados.</Typography>;
  }

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filteredPagos.slice(start, end);

  const hayAcciones = !!onEditarPago || !!onEliminarPago;

  return (
    <Paper>
      {/* Filtros */}
      <Box sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            label="Buscar (cliente o N° pedido)"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
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
          <Button
            variant="outlined"
            onClick={() => {
              setSearch("");
              setFechaDesde("");
              setFechaHasta("");
              setPage(0);
            }}
          >
            Limpiar filtros
          </Button>
        </Stack>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              {showCliente && <TableCell>Cliente</TableCell>}
              <TableCell>Orden</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Medio</TableCell>
              <TableCell>Confirmado</TableCell>
              <TableCell>N° cuota</TableCell>
              {hayAcciones && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((p) => {
              const orden = ordenesMap[p.ordenId];
              const codigoOrden =
                orden?.ordenCodigo ||
                p.ordenCodigo ||
                (p.ordenId
                  ? `PD-${String(p.ordenId).slice(0, 6).toUpperCase()}`
                  : "-");
              const conceptoOrden = orden?.concepto || p.conceptoOrden || "";

              const deshabilitarEliminar = eliminandoId === p.id;
              const deshabilitarEditar = editandoId === p.id;

              return (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.createdAt)}</TableCell>

                  {showCliente && (
                    <TableCell>
                      {clientesMap[p.clienteId] ||
                        p.clienteNombre ||
                        p.clienteId}
                    </TableCell>
                  )}

                  <TableCell>
                    {codigoOrden}{" "}
                    {conceptoOrden
                      ? `(${conceptoOrden.length > 15
                          ? conceptoOrden.slice(0, 15) + "..."
                          : conceptoOrden
                        })`
                      : ""}
                  </TableCell>

                  <TableCell>{p.monto}</TableCell>
                  <TableCell>{p.medio}</TableCell>
                  <TableCell>{p.confirmado ? "Sí" : "No"}</TableCell>
                  <TableCell>
                    {p.numeroCuota != null ? p.numeroCuota : "-"}
                  </TableCell>

                  {hayAcciones && (
                    <TableCell align="right">
                      {onEditarPago && (
                        <Tooltip title="Modificar pago">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => onEditarPago(p)}
                              disabled={deshabilitarEditar || deshabilitarEliminar}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {onEliminarPago && (
                        <Tooltip title="Eliminar pago">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onEliminarPago(p)}
                              disabled={deshabilitarEliminar}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total + paginación */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1
        }}
      >
        <Typography variant="subtitle2">
          Pagos encontrados: {filteredPagos.length} — Total:{" "}
          <strong>${totalMonto}</strong>
        </Typography>

        <TablePagination
          component="div"
          rowsPerPageOptions={[10]}
          count={filteredPagos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
        />
      </Box>
    </Paper>
  );
}

export default PagosTable;
