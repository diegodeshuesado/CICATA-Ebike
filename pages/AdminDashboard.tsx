
import React from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TRow, Paper, Chip, Button 
} from '@mui/material';
import { 
  DirectionsBike, People, Analytics, Bolt, 
  Visibility, Warning 
} from '@mui/icons-material';
import { MOCK_BIKES, COLORS } from '../constants';
import FleetMap from '../components/FleetMap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const stats = [
    { title: 'Bicicletas', value: '8', detail: '5 activas, 3 otros', icon: <DirectionsBike />, color: COLORS.ipnGuinda },
    { title: 'Usuarios', value: '12', detail: '3 investigadores', icon: <People />, color: COLORS.blueInfo },
    { title: 'Datos Hoy', value: '15,234', detail: '+1,200/hr', icon: <Analytics />, color: COLORS.greenActive },
    { title: 'kWh Total', value: '1,245', detail: 'Consumo mensual', icon: <Bolt />, color: COLORS.yellowMaint },
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
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 500 }}>
            <CardContent sx={{ height: '100%', p: 0, position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, pointerEvents: 'none' }}>
                 <Chip label="Ubicación en Tiempo Real" color="primary" sx={{ bgcolor: COLORS.ipnGuinda, fontWeight: 'bold' }} />
              </Box>
              <FleetMap bikes={MOCK_BIKES} />
            </CardContent>
          </Card>
        </Grid>

        {/* Status Breakdown / Alerts */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1, color: COLORS.redInactive }} /> Alertas de Mantenimiento
              </Typography>
              <Box sx={{ mt: 2 }}>
                {[
                  { id: 'B003', msg: 'Batería degradada', level: 'high' },
                  { id: 'B008', msg: 'Sensor temp. fallando', level: 'medium' },
                  { id: 'B006', msg: 'Inactiva > 24 hrs', level: 'low' },
                ].map((alert, i) => (
                  <Box key={i} sx={{ 
                    p: 2, mb: 1.5, borderRadius: 2, 
                    border: '1px solid #eee', 
                    borderLeft: `4px solid ${alert.level === 'high' ? COLORS.redInactive : COLORS.yellowMaint}`
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Bicicleta {alert.id}</Typography>
                    <Typography variant="body2" color="textSecondary">{alert.msg}</Typography>
                  </Box>
                ))}
              </Box>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>Ver todos los reportes</Button>
            </CardContent>
          </Card>
        </Grid>

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
                    {MOCK_BIKES.map((bike) => (
                      <tr key={bike.id} style={{ borderBottom: '1px solid #eee' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{bike.id}</TableCell>
                        <TableCell>{bike.modelo}</TableCell>
                        <TableCell>
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
                          <IconButton size="small" onClick={() => navigate(`/dashboard/bike/${bike.id}`)}>
                            <Visibility color="primary" />
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
