
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import BikeDetails from './pages/BikeDetails';
import UserDashboard from './pages/UserDashboard';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import BikesPage from './pages/BikesPage';
import ScadaPage from './pages/ScadaPage';
import SystemMetricsPage from './pages/SystemMetricsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        {/* Dashboard Principal */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute roles={['Administrador', 'Investigador']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Gestión de Bicicletas */}
        <Route
          path="/dashboard/bikes"
          element={
            <ProtectedRoute roles={['Administrador', 'Investigador']}>
              <BikesPage />
            </ProtectedRoute>
          }
        />

        {/* Sistema SCADA */}
        <Route
          path="/dashboard/scada/:id"
          element={
            <ProtectedRoute roles={['Administrador', 'Investigador', 'Usuario Bicicleta']}>
              <ScadaPage />
            </ProtectedRoute>
          }
        />

        {/* Telemetría Detallada */}
        <Route
          path="/dashboard/bike/:id"
          element={
            <ProtectedRoute>
              <BikeDetails />
            </ProtectedRoute>
          }
        />

        {/* Gestión de Usuarios (Solo Admin) */}
        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute roles={['Administrador']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Reportes y Analítica */}
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute roles={['Administrador', 'Investigador']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Métricas del Sistema */}
        <Route
          path="/dashboard/system-metrics"
          element={
            <ProtectedRoute roles={['Administrador', 'Investigador']}>
              <SystemMetricsPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard de Usuario Final */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute roles={['Usuario Bicicleta']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={
          user?.rol === 'Administrador' || user?.rol === 'Investigador'
            ? <Navigate to="/dashboard/admin" />
            : <Navigate to="/dashboard/user" />
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
