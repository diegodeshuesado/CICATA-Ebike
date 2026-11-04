import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// F5: antes este archivo definía sus propios `Divider`/`TableContainer`/
// `Table`/`TableHead`/`TableBody`/`TableCell` caseros al final del archivo
// (HTML plano con estilos inline) en vez de usar los componentes reales de
// MUI que ya usa el resto de la app (p. ej. `pages/UsersPage.tsx`) --
// generaba estilos/comportamiento inconsistentes (sin hover, sin el mismo
// espaciado/tipografía) y código duplicado sin motivo. Se importan los
// componentes reales y se quitaron los caseros.
import {
  Grid, Card, CardContent, Typography, Box,
  Button, Breadcrumbs, Link as MuiLink, Chip,
  Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import { 
  ArrowBack, Thermostat, ElectricalServices, 
  Bolt, BatteryChargingFull 
} from '@mui/icons-material';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { COLORS } from '../constants';
import { useBikes } from '../hooks/useBikes';
import { useTelemetry } from '../hooks/useTelemetry';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler
);

const BikeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bikeId = id || 'ebike1';

  const { getBikeById } = useBikes();
  const bike = getBikeById(bikeId) || { id: bikeId, modelo: 'E-Bike LEV', numero_serie: 'LEV-2024-001', bateria: 85 };

  // Polling de telemetría real desde InfluxDB sin objetos mock.
  // F4: antes el backend siempre devolvía 1 sola muestra sin importar el
  // `range` pedido, así que esta gráfica/tabla de "historial" en realidad
  // solo mostraba el dato más reciente. Ahora se pide explícitamente hasta
  // 100 muestras dentro de los últimos 30 días.
  const { telemetryList, latestReading } = useTelemetry(bikeId, '-30d', 2000, 100);

  const formatVal = (val?: number, digits: number = 1): string => {
    if (val === undefined || val === null || isNaN(val)) return '--';
    return val.toFixed(digits);
  };

  const v_bus = latestReading?.v_bus;
  const i_motor = latestReading?.i_motor;
  const potencia_w = latestReading?.potencia_w ?? (v_bus !== undefined && i_motor !== undefined ? v_bus * i_motor : undefined);
  const temp_motor = latestReading?.temp_motor;

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

  const chartData = (label: string, dataKey: string, color: string) => ({
    labels: telemetryList.map(t => new Date(t._time).toLocaleTimeString()),
    datasets: [{
      label,
      data: telemetryList.map(t => (t as any)[dataKey] ?? 0),
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true,
      pointRadius: 2
    }]
  });

  const GaugeCard = ({ title, valueStr, unit, icon, color }: any) => (
    <Card sx={{ textAlign: 'center', height: '100%', borderBottom: `4px solid ${color}` }}>
      <CardContent>
        <Box sx={{ mb: 1, color }}>{icon}</Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {valueStr} {valueStr !== '--' && <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>{unit}</span>}
        </Typography>
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
            <Typography color="textPrimary">Detalle {bikeId}</Typography>
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
        {/* Real-time InfluxDB Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Voltaje (v_bus)" valueStr={formatVal(v_bus, 1)} unit="V" icon={<ElectricalServices fontSize="large" />} color={COLORS.greenActive} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Corriente (i_motor)" valueStr={formatVal(i_motor, 1)} unit="A" icon={<Bolt fontSize="large" />} color={COLORS.yellowMaint} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Potencia (potencia_w)" valueStr={formatVal(potencia_w, 1)} unit="W" icon={<Bolt fontSize="large" />} color={COLORS.ipnGuinda} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GaugeCard title="Temperatura (temp_motor)" valueStr={formatVal(temp_motor, 1)} unit="°C" icon={<Thermostat fontSize="large" />} color={COLORS.redInactive} />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Histórico de Potencia - potencia_w (InfluxDB)</Typography>
              <Box sx={{ height: 250 }}>
                <Line data={chartData('Potencia (W)', 'potencia_w', COLORS.ipnGuinda)} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Consumo de Corriente - i_motor (InfluxDB)</Typography>
              <Box sx={{ height: 250 }}>
                <Line data={chartData('Corriente (A)', 'i_motor', COLORS.yellowMaint)} options={chartOptions} />
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
                  <Typography variant="body2" color="textSecondary">Último Timestamp InfluxDB:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {latestReading?._time ? new Date(latestReading._time).toLocaleTimeString() : '--:--:--'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Estado de Batería</Typography>
                {/* F2: bike.bateria puede ser null (sin lectura reciente para
                    esta bicicleta -- honesto en vez de un número inventado). */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <BatteryChargingFull sx={{ color: COLORS.greenActive, mr: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {bike.bateria !== null && bike.bateria !== undefined ? `${bike.bateria}%` : 'Sin datos'}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 15, bgcolor: '#eee', borderRadius: 10, mt: 1 }}>
                  <Box sx={{ width: `${bike.bateria ?? 0}%`, height: '100%', bgcolor: COLORS.greenActive, borderRadius: 10 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Registros de Telemetría InfluxDB</Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp (_time)</TableCell>
                        <TableCell>v_bus</TableCell>
                        <TableCell>i_motor</TableCell>
                        <TableCell>potencia_w</TableCell>
                        <TableCell>temp_motor</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {telemetryList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} style={{ textAlign: 'center', padding: '16px' }}>
                            Sin lecturas en InfluxDB
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...telemetryList].reverse().map((t, i) => (
                          <TableRow key={i} hover>
                            <TableCell>{new Date(t._time).toLocaleTimeString()}</TableCell>
                            <TableCell>{formatVal(t.v_bus, 1)}V</TableCell>
                            <TableCell>{formatVal(t.i_motor, 1)}A</TableCell>
                            <TableCell>{formatVal(t.potencia_w, 1)}W</TableCell>
                            <TableCell>{formatVal(t.temp_motor, 1)}°C</TableCell>
                            <TableCell><Chip label="INFLUX OK" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>
                          </TableRow>
                        ))
                      )}
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
