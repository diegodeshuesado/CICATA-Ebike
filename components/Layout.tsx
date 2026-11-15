
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Avatar, Menu, MenuItem, Divider,
  Switch, FormControlLabel, Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, DirectionsBike,
  People, BarChart, Logout, Person, SettingsInputComponent, Speed
} from '@mui/icons-material';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useDemoMode } from '../hooks/useDemoMode';
import { UserRole } from '../types';

const DRAWER_WIDTH = 240;

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // D1: interruptor de modo demo (solo Administrador puede activarlo --
  // ver server/index.js POST /api/demo-mode). A propósito los datos
  // simulados no llevan ninguna marca visual distinta en el resto de la
  // UI (decisión explícita del usuario), este switch es el único lugar
  // donde el modo demo es visible.
  const { enabled: demoModeEnabled, setEnabled: setDemoModeEnabled } = useDemoMode();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: user?.rol === UserRole.USUARIO ? '/dashboard/user' : '/dashboard/admin'
    },
    {
      text: 'Bicicletas',
      icon: <DirectionsBike />,
      path: '/dashboard/bikes',
      hide: user?.rol === UserRole.USUARIO
    },

    {
      text: 'Usuarios',
      icon: <People />,
      path: '/dashboard/users',
      hide: user?.rol !== UserRole.ADMIN
    },
    {
      text: 'Reportes',
      icon: <BarChart />,
      path: '/dashboard/reports',
      hide: user?.rol === UserRole.USUARIO
    },
    {
      text: 'Métricas del Sistema',
      icon: <Speed />,
      path: '/dashboard/system-metrics',
      hide: user?.rol === UserRole.USUARIO
    },
  ].filter(i => !i.hide);

  const drawer = (
    <Box sx={{ bgcolor: 'white', height: '100%' }}>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <img src="/logo-cicata.png" alt="CICATA" style={{ width: 140, objectFit: 'contain' }} />
      </Box>
      <Divider />
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  color: COLORS.ipnGuinda,
                  '& .MuiListItemIcon-root': { color: COLORS.ipnGuinda },
                  bgcolor: `${COLORS.ipnGuinda}10`
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 'bold' : 'normal' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: COLORS.ipnGuinda,
          boxShadow: 'none'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 2 }}>
              <img src="/logo-cicata.png" alt="Logo CICATA" style={{ height: 40, borderRadius: 0, marginRight: 0, filter: 'drop-shadow(0 0 2px white)' }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '1.1rem' }, lineHeight: 1.2 }}>
              Sistema de Telemetría LEVs - IPN CICATA Querétaro
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user?.rol === UserRole.ADMIN && (
              <Tooltip title="Al activarlo, las bicicletas sin telemetría real (todas salvo B001) muestran datos simulados para poder exponer el sistema completo">
                <FormControlLabel
                  sx={{ mr: 0, display: { xs: 'none', md: 'flex' } }}
                  control={
                    <Switch
                      size="small"
                      checked={demoModeEnabled}
                      onChange={(e) => setDemoModeEnabled(e.target.checked)}
                      color="warning"
                    />
                  }
                  label={<Typography variant="caption" sx={{ color: 'white' }}>Modo Demo</Typography>}
                />
              </Tooltip>
            )}
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {user?.nombre}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user?.rol}
              </Typography>
            </Box>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ bgcolor: 'white', color: COLORS.ipnGuinda, width: 32, height: 32 }}>
                {user?.nombre?.[0] || ''}
              </Avatar>
            </IconButton>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <img src="/logo-ipn.png" alt="Logo IPN" style={{ height: 45, width: 'auto', borderRadius: 0, filter: 'drop-shadow(0 0 2px white)' }} />
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleMenuClose}><Person sx={{ mr: 1.5, fontSize: 20 }} /> Mi Perfil</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout sx={{ mr: 1.5, fontSize: 20 }} /> Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none', bgcolor: 'transparent' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: 8 }}>
        <Outlet />

        <Box component="footer" sx={{ py: 3, mt: 4, textAlign: 'center', borderTop: '1px solid #ddd' }}>
          <Typography variant="body2" color="textSecondary">
            © 2024-2025 Instituto Politécnico Nacional
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
            CICATA Unidad Querétaro
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
