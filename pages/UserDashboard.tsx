
import React from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, Paper, Button, Avatar, Chip
} from '@mui/material';
import { 
  History, DirectionsBike, Timeline, EmojiEvents, 
  PlayArrow, BatteryFull
} from '@mui/icons-material';
import { MOCK_TRIPS, MOCK_BIKES, COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userStats = [
    { title: 'Distancia Total', value: '45.1 km', icon: <Timeline />, color: COLORS.blueInfo },
    { title: 'Viajes Realizados', value: '10', icon: <History />, color: COLORS.ipnGuinda },
    { title: 'Energía Ahorrada', value: '382 Wh', icon: <EmojiEvents />, color: COLORS.greenActive },
  ];

  // Filtrar bicicletas disponibles (activas y con más de 15% de batería)
  const availableBikes = MOCK_BIKES.filter(b => b.estado === 'activa' && b.bateria > 15);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 64, height: 64, mr: 3, bgcolor: COLORS.ipnGuinda }}>{user?.nombre[0]}</Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Bienvenido, {user?.nombre}</Typography>
          <Typography variant="body1" color="textSecondary">Bicicleta Asignada: <strong>{user?.bicicletaAsignada || 'Ninguna'}</strong></Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {userStats.map((stat, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${stat.color}15`, color: stat.color, mr: 2 }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">{stat.title}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Historial de Viajes */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} /> Mi Historial de Viajes
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', mt: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                    <tr>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Distancia</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Duración</TableCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {MOCK_TRIPS.slice(0, 5).map((trip, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <TableCell sx={{ py: 1.5 }}>{trip.fecha}</TableCell>
                        <TableCell>{trip.distancia} km</TableCell>
                        <TableCell>{trip.duracion}</TableCell>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button fullWidth sx={{ mt: 2 }} color="primary">Ver historial completo</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Bicicletas Disponibles */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike sx={{ mr: 1 }} /> Bicicletas Disponibles Cerca
              </Typography>
              <Box sx={{ mt: 2 }}>
                {availableBikes.map((bike) => (
                  <Box key={bike.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 1.5, 
                    mb: 1, 
                    borderRadius: 2, 
                    border: '1px solid #eee',
                    '&:hover': { bgcolor: '#f8f9fa' }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DirectionsBike color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{bike.id} - {bike.modelo}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BatteryFull sx={{ fontSize: 14, color: COLORS.greenActive, mr: 0.5 }} />
                          <Typography variant="caption" color="textSecondary">{bike.bateria}% batería</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      sx={{ borderRadius: 5 }}
                      onClick={() => navigate(`/dashboard/bike/${bike.id}`)}
                    >
                      Reservar
                    </Button>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Call to Action */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: COLORS.ipnGuinda, color: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 3, px: 4 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>¿Listo para un nuevo viaje?</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Recuerda usar siempre tu equipo de protección y respetar los límites de velocidad.
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<PlayArrow />}
                sx={{ bgcolor: 'white', color: COLORS.ipnGuinda, px: 4, '&:hover': { bgcolor: '#f0f0f0' } }}
              >
                Escanear QR e Iniciar
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;
