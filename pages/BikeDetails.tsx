
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, Card, CardContent, Typography, Box, 
  Button, Breadcrumbs, Link as MuiLink, Chip
} from '@mui/material';
import { 
  ArrowBack, Speed, Thermostat, ElectricalServices, 
  Bolt, BatteryChargingFull 
} from '@mui/icons-material';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MOCK_BIKES, COLORS } from '../constants';
import { TelemetryData } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler
);

const BikeDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const bike = MOCK_BIKES.find(b => b.id === id);
  
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [current, setCurrent] = useState<TelemetryData>({
    voltaje: 38.5,
    corriente: 12.2,
    velocidad: 15.0,
    temperatura: 42.0,
    potencia: 469.7,
    timestamp: new Date().toLocaleTimeString()
  });

  // Simulation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const nextVolt = 36 + Math.random() * 6;
        const nextCurr = Math.random() * 25;
        const nextSpeed = Math.max(0, current.velocidad + (Math.random() - 0.5) * 4);
        const nextTemp = Math.min(80, current.temperatura + (Math.random() * 0.1));
        
        const newData: TelemetryData = {
          voltaje: Number(nextVolt.toFixed(2)),
          corriente: Number(nextCurr.toFixed(2)),
          velocidad: Number(nextSpeed.toFixed(1)),
          temperatura: Number(nextTemp.toFixed(1)),
          potencia: Number((nextVolt * nextCurr).toFixed(1)),
          timestamp: new Date().toLocaleTimeString()
        };
        
        setCurrent(newData);
        const nextList = [...prev, newData];
        return nextList.slice(-20); // Keep last 20 points
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [current]);

  if (!bike) return <Typography>Cargando...</Typography>;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    },
    elements: { line: { tension: 0.4 } }
  };

  const chartData = (label: string, dataKey: keyof TelemetryData, color: string) => ({
    labels: telemetry.map(t => t.timestamp),
    datasets: [{
      label,
      data: telemetry.map(t => t[dataKey] as number),
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true,
      pointRadius: 2
    }]
  });

  const GaugeCard = ({ title, value, unit, icon, color }: any) => (
    <Card sx={{ textAlign: 'center', height: '100%', borderBottom: `4px solid ${color}` }}>
      <CardContent>
        <Box sx={{ mb: 1, color }}>{icon}</Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>{unit}</span></Typography>
        <Typography variant="body2" color="textSecondary">{title}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <MuiLink underline="hover" color="inherit" onClick={() => navigate('/dashboard/admin')} sx={{ cursor: 'pointer' }}>Flota</MuiLink>
            <Typography color="textPrimary">Detalle {id}</Typography>
          </Breadcrumbs>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.grayDark }}>
            Bicicleta {bike.id} - {bike.modelo}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/dashboard/admin')}
          sx={{ bgcolor: COLORS.ipnGuinda }}
        >
          Volver al Panel
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Real-time Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Velocidad" value={current.velocidad} unit="km/h" icon={<Speed fontSize="large" />} color={COLORS.blueInfo} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Temperatura" value={current.temperatura} unit="°C" icon={<Thermostat fontSize="large" />} color={COLORS.redInactive} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Potencia" value={current.potencia} unit="W" icon={<Bolt fontSize="large" />} color={COLORS.yellowMaint} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Voltaje" value={current.voltaje} unit="V" icon={<ElectricalServices fontSize="large" />} color={COLORS.greenActive} />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Histórico de Velocidad (20s)</Typography>
              <Box sx={{ height: 250 }}>
                <Line data={chartData('Velocidad', 'velocidad', COLORS.blueInfo)} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Consumo de Corriente (20s)</Typography>
              <Box sx={{ height: 250 }}>
                <Line data={chartData('Corriente', 'corriente', COLORS.yellowMaint)} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Info & Battery */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Información del Sistema</Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">Número de Serie:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{bike.numero_serie}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">Firmware:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>v2.4.1-cicata</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">Uptime:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>02:45:12</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Estado de Batería</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <BatteryChargingFull sx={{ color: COLORS.greenActive, mr: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{bike.bateria}%</Typography>
                </Box>
                <Box sx={{ width: '100%', height: 15, bgcolor: '#eee', borderRadius: 10, mt: 1 }}>
                  <Box sx={{ width: `${bike.bateria}%`, height: '100%', bgcolor: COLORS.greenActive, borderRadius: 10 }} />
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Autonomía estimada: ~35 km
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Registros Críticos Recientes</Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <tr>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Voltaje</TableCell>
                        <TableCell>Corriente</TableCell>
                        <TableCell>Temp</TableCell>
                        <TableCell>Status</TableCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {[...telemetry].reverse().map((t, i) => (
                        <tr key={i}>
                          <TableCell>{t.timestamp}</TableCell>
                          <TableCell>{t.voltaje}V</TableCell>
                          <TableCell>{t.corriente}A</TableCell>
                          <TableCell>{t.temperatura}°C</TableCell>
                          <TableCell><Chip label="OK" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>
                        </tr>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BikeDetails;

// Minimal custom helper components for consistency
const Divider = ({ sx }: any) => <Box sx={{ borderBottom: '1px solid #eee', ...sx }} />;
const TableContainer = ({ children }: any) => <Box>{children}</Box>;
const Table = ({ children, size }: any) => <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>;
const TableHead = ({ children }: any) => <thead style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>{children}</thead>;
const TableBody = ({ children }: any) => <tbody>{children}</tbody>;
const TableCell = ({ children, sx }: any) => <td style={{ padding: '8px', fontSize: '0.875rem', ...sx }}>{children}</td>;
