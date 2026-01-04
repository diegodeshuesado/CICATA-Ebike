
import React from 'react';
import { 
  Box, Typography, Card, CardContent, Table, 
  TableBody, TableCell, TableContainer, TableHead, 
  Paper, Chip, Button, IconButton, Avatar
} from '@mui/material';
import { Edit, Delete, PersonAdd, Security } from '@mui/icons-material';
import { MOCK_USERS, COLORS } from '../constants';

const UsersPage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.grayDark }}>
          Control de Usuarios
        </Typography>
        <Button variant="contained" startIcon={<PersonAdd />} sx={{ bgcolor: COLORS.ipnGuinda }}>
          Nuevo Usuario
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <tr>
                  <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>NFC ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {MOCK_USERS.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: COLORS.ipnGuinda }}>{user.nombre[0]}</Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{user.nombre}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.rol} 
                        icon={<Security sx={{ fontSize: '1rem !important' }} />}
                        size="small" 
                        variant="outlined"
                        color={user.rol === 'Administrador' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{user.nfc || 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton size="small"><Edit /></IconButton>
                      <IconButton size="small" color="error"><Delete /></IconButton>
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

export default UsersPage;
