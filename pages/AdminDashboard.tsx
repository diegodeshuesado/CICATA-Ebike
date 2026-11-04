
import React from 'react';
import {
  Grid, Card, CardContent, Typography, Box,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Button
} from '@mui/material';
import {
  DirectionsBike, People, Analytics, Bolt,
  Visibility, Warning, Edit, SettingsInputComponent
} from '@mui/icons-material';
import { MOCK_BIKES, COLORS } from '../constants';
import { useBikes } from '../hooks/useBikes';
import { useUsers } from '../hooks/useUsers';
import FleetMap from '../components/FleetMap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { bikes } = useBikes();
  const { users } = useUsers();

  // Dynamic calculations
  const totalBikes = bikes.length;
  const activeBikes = bikes.filter(b => b.estado === 'activa').length;
  const inactiveBikes = bikes.filter(b => b.estado === 'inactiva').length;
  const maintBikes = bikes.filter(b => b.estado === 'mantenimiento').length;

  const totalUsers = users.length;
  const researchers = users.filter(u => u.rol === 'Investigador').length;

  // Simulate daily data based on active bikes
  const todayDataPoints = (activeBikes * 1200 * (new Date().getHours() + 1)).toLocaleString();

  // Simulate Power Consumption
  const totalKWh = (totalBikes * 150 + Math.floor(Math.random() * 50)).toLocaleString();

  const stats = [
    {
      title: 'Bicicletas',
      value: totalBikes.toString(),
      detail: `${activeBikes} activas, ${maintBikes + inactiveBikes} otras`,
      icon: <DirectionsBike />,
      color: COLORS.ipnGuinda
    },
    {
      title: 'Usuarios',
      value: totalUsers.toString(),
      detail: `${researchers} investigadores`,
      icon: <People />,
      color: COLORS.blueInfo
    },
    {
      title: 'Datos Hoy',
      value: todayDataPoints,
      detail: `+${(activeBikes * 1200).toLocaleString()}/hr est.`,
      icon: <Analytics />,
      color: COLORS.greenActive
    },
    {
      title: 'kWh Total',
      value: totalKWh,
      detail: 'Consumo mensual est.',
      icon: <Bolt />,
      color: COLORS.yellowMaint
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, color: COLORS.grayDark }}>
        Panel de Control - Resumen de Flota
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderLeft: `5px solid ${stat.color}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  mr: 2,
                  p: 1.5,
                  borderRadius: '50%',
                  bgcolor: `${stat.color}15`,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">{stat.title}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
                  <Typography variant="caption" color="textSecondary">{stat.detail}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12} lg={12}>
          <Card sx={{ height: 500 }}>
            <CardContent sx={{ height: '100%', p: 0, position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, pointerEvents: 'none' }}>
                <Chip label="Ubicación en Tiempo Real" color="primary" sx={{ bgcolor: COLORS.ipnGuinda, fontWeight: 'bold' }} />
              </Box>
              <FleetMap bikes={bikes} />
            </CardContent>
          </Card>
        </Grid>

        {/* Status Breakdown / Alerts - REMOVED */}

        {/* Fleet Table */}

        {/* Fleet Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Estado de la Flota</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                    <tr>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Modelo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Batería</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Último Dato</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {bikes.map((bike) => (
                      <tr key={bike.id} style={{ borderBottom: '1px solid #eee' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{bike.id}</TableCell>
                        <TableCell>{bike.modelo}</TableCell>
                        <TableCell>
                          {/* F2: bike.bateria puede ser null (sin lectura
                              reciente para esta bicicleta) -- honesto en vez
                              de inventar un número. */}
                          {bike.bateria !== null ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 100, height: 10, bgcolor: '#eee', borderRadius: 5, mr: 1 }}>
                                <Box sx={{
                                  width: `${bike.bateria}%`,
                                  height: '100%',
                                  bgcolor: bike.bateria > 20 ? COLORS.greenActive : COLORS.redInactive,
                                  borderRadius: 5
                                }} />
                              </Box>
                              {bike.bateria}%
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">Sin datos</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={bike.estado}
                            size="small"
                            sx={{
                              bgcolor: bike.estado === 'activa' ? `${COLORS.greenActive}20` : bike.estado === 'inactiva' ? `${COLORS.redInactive}20` : `${COLORS.yellowMaint}20`,
                              color: bike.estado === 'activa' ? COLORS.greenActive : bike.estado === 'inactiva' ? COLORS.redInactive : COLORS.yellowMaint,
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell>{bike.ultimo_dato}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => navigate(`/dashboard/scada/${bike.id}`)}>
                            <SettingsInputComponent color="info" />
                          </IconButton>
                          {/* Note: Edit logic simplified for dashboard view, could redirect to bikes page or open modal */}
                          <IconButton size="small" onClick={() => navigate('/dashboard/bikes')}>
                            <Edit color="secondary" />
                          </IconButton>
                        </TableCell>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;

// Small shim for table formatting
const IconButton: React.FC<{ children: React.ReactNode, size: string, onClick: () => void }> = ({ children, onClick }) => (
  <Button sx={{ minWidth: 0, p: 0.5 }} onClick={onClick}>{children}</Button>
);
