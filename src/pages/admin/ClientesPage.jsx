// src/pages/admin/ClientesPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  TextField
} from "@mui/material";
import {
  listarClientes,
  crearCliente
} from "../../services/clientes";
import ClienteForm from "../../components/clientes/ClienteForm";
import ClientesTable from "../../components/clientes/ClientesTable";

function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    observaciones: ""
  });
  const [errorForm, setErrorForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    try {
      setCargando(true);
      const data = await listarClientes({ soloActivos: false });
      setClientes(data);
      setErrorGlobal(null);
    } catch (err) {
      console.error(err);
      setErrorGlobal("Error al cargar clientes");
    } finally {
      setCargando(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim()) {
      setErrorForm("Nombre y email son obligatorios");
      return;
    }

    try {
      setGuardando(true);
      setErrorForm(null);

      await crearCliente({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        observaciones: form.observaciones.trim()
      });

      setForm({
        nombre: "",
        email: "",
        telefono: "",
        observaciones: ""
      });

      await cargarClientes();
    } catch (err) {
      console.error(err);
      setErrorForm("Error al crear el cliente");
    } finally {
      setGuardando(false);
    }
  }

  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;

    return clientes.filter((c) => {
      const nombre = (c.nombre || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const tel = (c.telefono || "").toLowerCase();
      return (
        nombre.includes(term) ||
        email.includes(term) ||
        tel.includes(term)
      );
    });
  }, [clientes, search]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Clientes
      </Typography>

      <ClienteForm
        form={form}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        guardando={guardando}
        error={errorForm}
      />


      {errorGlobal && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorGlobal}
        </Typography>
      )}

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ClientesTable clientes={clientesFiltrados} />
      )}
    </Box>
  );
}

export default ClientesPage;
