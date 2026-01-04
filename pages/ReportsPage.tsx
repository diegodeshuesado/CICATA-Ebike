
import React, { useState, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, MenuItem, TextField, Fade } from '@mui/material';
import { Download, FilterList } from '@mui/icons-material';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { COLORS, MOCK_BIKES } from '../constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [selectedBike, setSelectedBike] = useState('all');

  // Simulación de datos dinámicos basados en filtros
  const energyData = useMemo(() => {
    let labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    let data = [12, 19, 15, 8, 22, 30, 25];

    if (period === '24h') {
      labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
      data = [2, 1, 5, 12, 18, 10];
    } else if (period === '30d') {
      labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      data = [120, 145, 130, 160];
    }

    // Variar un poco si hay una bicicleta específica
    if (selectedBike !== 'all') {
      data = data.map(v => Math.floor(v * (0.1 + Math.random() * 0.4)));
    }

    return {
      labels,
      datasets: [{
        label: 'Consumo kWh',
        data: data,
        backgroundColor: COLORS.ipnGuinda,
        borderRadius: 8
      }]
    };
  }, [period, selectedBike]);

  const fleetStatusData = useMemo(() => {
    // Si se selecciona una sola bici, el gráfico de pay cambia para mostrar salud de esa bici
    if (selectedBike !== 'all') {
      return {
        labels: ['Salud Batería', 'Uso Motor', 'Desgaste'],
        datasets: [{
          data: [85, 10, 5],
          backgroundColor: [COLORS.greenActive, COLORS.blueInfo, COLORS.grayMedium],
          borderWidth: 0,
        }]
      };
    }

    return {
      labels: ['Activas', 'Mantenimiento', 'Inactivas'],
      datasets: [{
        data: [5, 2, 1],
        backgroundColor: [COLORS.greenActive, COLORS.yellowMaint, COLORS.redInactive],
        borderWidth: 0,
      }]
    };
  }, [selectedBike]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.grayDark }}>
          Reportes y Analítica
        </Typography>
        <Button variant="outlined" startIcon={<Download />}>
          Exportar Informe
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <FilterList color="action" sx={{ mr: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Filtros:</Typography>
          </Box>
          <TextField 
            select 
            label="Periodo de Tiempo" 
            size="small" 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="24h">Últimas 24 horas</MenuItem>
            <MenuItem value="7d">Últimos 7 días</MenuItem>
            <MenuItem value="30d">Últimos 30 días</MenuItem>
          </TextField>
          <TextField 
            select 
            label="Vehículo" 
            size="small" 
            value={selectedBike}
            onChange={(e) => setSelectedBike(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Toda la Flota</MenuItem>
            {MOCK_BIKES.map(bike => (
              <MenuItem key={bike.id} value={bike.id}>{bike.id} - {bike.modelo}</MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Fade in={true} key={period + selectedBike}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedBike === 'all' ? 'Consumo Energético Total' : `Consumo de Unidad ${selectedBike}`}
                </Typography>
                <Box sx={{ height: 350 }}>
                  <Bar 
                    data={energyData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { display: false },
                        tooltip: { backgroundColor: COLORS.grayDark }
                      },
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Energía (kWh)' } }
                      }
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
        <Grid item xs={12} md={4}>
          <Fade in={true} key={selectedBike}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedBike === 'all' ? 'Estado de Disponibilidad' : 'Diagnóstico de Salud'}
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pie data={fleetStatusData} options={{ maintainAspectRatio: false }} />
                </Box>
                <Box sx={{ mt: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary" align="center">
                    {selectedBike === 'all' 
                      ? "Datos consolidados de 8 unidades monitoreadas." 
                      : `Análisis detallado de la unidad ${selectedBike} basada en telemetría.`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
