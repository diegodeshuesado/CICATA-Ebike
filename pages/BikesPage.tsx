
import React from 'react';
import { 
  Box, Typography, Card, CardContent, Table, 
  TableBody, TableCell, TableContainer, TableHead, 
  Paper, Chip, Button, IconButton, TextField, InputAdornment 
} from '@mui/material';
import { Visibility, Search, DirectionsBike, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MOCK_BIKES, COLORS } from '../constants';

const BikesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.grayDark }}>
          Gestión de Flota LEVs
        </Typography>
        <Button variant="contained" startIcon={<Add />} sx={{ bgcolor: COLORS.ipnGuinda }}>
          Nueva Bicicleta
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <TextField 
              fullWidth 
              placeholder="Buscar por ID, Modelo o Serie..." 
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="outlined" startIcon={<DirectionsBike />}>Filtros</Button>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <tr>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Modelo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Serie</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Batería</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Velocidad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {MOCK_BIKES.map((bike) => (
                  <tr key={bike.id} style={{ borderBottom: '1px solid #eee' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{bike.id}</TableCell>
                    <TableCell>{bike.modelo}</TableCell>
                    <TableCell>{bike.numero_serie}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 60, height: 8, bgcolor: '#eee', borderRadius: 4, mr: 1 }}>
                          <Box sx={{ 
                            width: `${bike.bateria}%`, 
                            height: '100%', 
                            bgcolor: bike.bateria > 20 ? COLORS.greenActive : COLORS.redInactive,
                            borderRadius: 4 
                          }} />
                        </Box>
                        {bike.bateria}%
                      </Box>
                    </TableCell>
                    <TableCell>{bike.velocidad} km/h</TableCell>
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
                    <TableCell>
                      <IconButton color="primary" onClick={() => navigate(`/dashboard/bike/${bike.id}`)}>
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BikesPage;
