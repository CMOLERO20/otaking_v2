// src/pages/admin/DashboardPage.jsx
import React from "react";
import { Typography } from "@mui/material";

function DashboardPage() {
  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Dashboard
      </Typography>
      <Typography>
        Acá después vas a mostrar resúmenes, métricas, etc.
      </Typography>
    </>
  );
}

export default DashboardPage;
