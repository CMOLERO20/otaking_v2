// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import ClientesPage from "./pages/admin/ClientesPage";
import OrdenesPage from "./pages/admin/OrdenesPage";  
import PagosPage from "./pages/admin/PagosPage"; // 👈 importar
import ClienteDetallePage from "./pages/admin/ClienteDetallePage";
import OrdenDetallePage from "./pages/admin/OrdenDetallePage";

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/:clienteId" element={<ClienteDetallePage />} />
        <Route path="ordenes" element={<OrdenesPage />} />   {/* 👈 nueva ruta */}
        <Route path="ordenes/:ordenId" element={<OrdenDetallePage />} />
        <Route path="pagos" element={<PagosPage />} /> 
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
