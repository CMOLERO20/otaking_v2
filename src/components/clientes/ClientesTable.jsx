// src/components/clientes/ClientesTable.jsx
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
  TextField,
  Box,
  Stack,
  Button
} from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Props:
 *  - clientes: array de clientes
 */
function ClientesTable({ clientes }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 25;

  // Cuando cambia el filtro, volvemos a la primera página
  useEffect(() => {
    setPage(0);
  }, [search]);

  const filteredClientes = useMemo(() => {
    if (!clientes) return [];
    const term = search.trim().toLowerCase();
    if (!term) return clientes;

    return clientes.filter((c) => {
      const nombre = (c.nombre || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const telefono = (c.telefono || "").toLowerCase();
      return (
        nombre.includes(term) ||
        email.includes(term) ||
        telefono.includes(term)
      );
    });
  }, [clientes, search]);

  if (!clientes || clientes.length === 0) {
    return <Typography>No hay clientes cargados.</Typography>;
  }

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filteredClientes.slice(start, end);

  return (
    <Paper>
      {/* Buscador */}
      <Box sx={{ p: 2 }}>
        <TextField
          label="Buscar cliente"
          placeholder="Nombre, email o teléfono"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.nombre}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.telefono}</TableCell>
                <TableCell>{c.activo ? "Sí" : "No"}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    to={`/admin/clientes/${c.id}`}
                  >
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
          Clientes encontrados: <strong>{filteredClientes.length}</strong>
        </Typography>

        <TablePagination
          component="div"
          rowsPerPageOptions={[25]}
          count={filteredClientes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
        />
      </Box>
    </Paper>
  );
}

export default ClientesTable;
