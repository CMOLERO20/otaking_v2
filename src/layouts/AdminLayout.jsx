// src/layouts/AdminLayout.jsx
import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  AppBar,
  Toolbar,
  Typography
} from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";

const drawerWidth = 220;

const menuItems = [
  { id: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
  { id: "clientes", label: "Clientes", path: "/admin/clientes" },
  { id: "ordenes", label: "Pedidos", path: "/admin/ordenes" },
  { id: "pagos", label: "Pagos", path: "/admin/pagos" }
];

function AdminLayout() {
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* MENÚ LATERAL */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box"
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" noWrap>
            Mi Tienda
          </Typography>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.id}
              component={Link}
              to={item.path}
              selected={location.pathname.startsWith(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* DERECHA: BARRA SUPERIOR + CONTENIDO */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div">
              Panel administrador
            </Typography>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
          {/* Acá se renderizan las páginas hijas */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;
