import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table,
  TableBody, TableCell, TableContainer, TableHead,
  Paper, Chip, Button, IconButton, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import { Visibility, Search, DirectionsBike, Add, Edit, SettingsInputComponent } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { MOCK_BIKES, COLORS } from '../constants';
import { useBikes } from '../hooks/useBikes';
import { useAuth } from '../context/AuthContext';
import { Bike, BikeStatus } from '../types';

const BikesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  const { bikes, updateBikeStatus } = useBikes();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [newStatus, setNewStatus] = useState<BikeStatus>('activa');

  const isInvestigator = user?.rol === 'Investigador';

  const handleEditClick = (bike: Bike) => {
    setSelectedBike(bike);
    setNewStatus(bike.estado);
    setEditOpen(true);
  };

  const handleClose = () => {
    setEditOpen(false);
    setSelectedBike(null);
  };

  const handleSaveStatus = () => {
    if (selectedBike) {
      updateBikeStatus(selectedBike.id, newStatus);
      handleClose();
    }
  };

  const handleStatusChange = (event: SelectChangeEvent<BikeStatus>) => {
    setNewStatus(event.target.value as BikeStatus);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.grayDark }}>
          Gestión de Flota LEVs
        </Typography>
        {!isInvestigator && (
          <Button variant="contained" startIcon={<Add />} sx={{ bgcolor: COLORS.ipnGuinda }}>
            Nueva Bicicleta
          </Button>
        )}
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
                {bikes.map((bike) => (
                  <tr key={bike.id} style={{ borderBottom: '1px solid #eee' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{bike.id}</TableCell>
                    <TableCell>{bike.modelo}</TableCell>
                    <TableCell>{bike.numero_serie}</TableCell>
                    <TableCell>
                      {/* F2: bike.bateria puede ser null (sin lectura reciente
                          de InfluxDB para esta bicicleta) -- se muestra
                          honestamente "Sin datos" en vez de una barra vacía
                          o un número inventado. */}
                      {bike.bateria !== null ? (
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
                      ) : (
                        <Typography variant="caption" color="textSecondary">Sin datos</Typography>
                      )}
                    </TableCell>
                    <TableCell>{bike.velocidad !== null ? `${bike.velocidad} km/h` : 'Sin datos'}</TableCell>
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
                      {!isInvestigator && (
                        <IconButton color="secondary" onClick={() => handleEditClick(bike)} title="Editar Estado">
                          <Edit />
                        </IconButton>
                      )}
                      <IconButton color="info" onClick={() => navigate(`/dashboard/scada/${bike.id}`)} title="Ver SCADA">
                        <SettingsInputComponent />
                      </IconButton>
                    </TableCell>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={handleClose}>
        <DialogTitle>Editar Estado de Bicicleta</DialogTitle>
        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
          {selectedBike && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Bicicleta: {selectedBike.modelo} ({selectedBike.id})
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Estado</InputLabel>
                <Select
                  labelId="status-label"
                  value={newStatus}
                  label="Estado"
                  onChange={handleStatusChange}
                >
                  <MenuItem value="activa">Activa</MenuItem>
                  <MenuItem value="inactiva">Inactiva</MenuItem>
                  <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSaveStatus} variant="contained" sx={{ bgcolor: COLORS.ipnGuinda }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BikesPage;
