
import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, IconButton, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, FormControl, InputLabel, Select, Grid, Alert
} from '@mui/material';
import { Edit, Delete, PersonAdd, Security, Save, Cancel, HowToReg, ContentCopy } from '@mui/icons-material';
import { MOCK_USERS, COLORS } from '../constants';
import { User, UserRole } from '../types';
import { useUsers } from '../hooks/useUsers';
import { useBikes } from '../hooks/useBikes';
import { useAuth } from '../context/AuthContext';

const UsersPage: React.FC = () => {
  // Use custom hook for user management
  const { users, addUser, updateUser, deleteUser, approveUser } = useUsers();
  // F11: para persistir de verdad "Bicicleta Asignada (ID)" -- ver
  // handleSaveUser más abajo y hooks/useBikes.ts assignUserToBike().
  const { bikes, assignUserToBike } = useBikes();
  const { user: authUser, updateAuthUser } = useAuth();
  const isAdmin = authUser?.rol === UserRole.ADMIN;

  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  // F10: antes editar/eliminar nunca podía fallar porque en realidad no
  // pegaban al backend -- ahora que sí lo hacen, hace falta mostrar el
  // error si el servidor los rechaza (p. ej. correo duplicado).
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  // F6: contraseña opcional al dar de alta un usuario (solo aplica a "Nuevo
  // Usuario", no a editar). Si se deja vacía, el backend genera una
  // temporal -- antes esa temporal se generaba y se perdía en silencio, sin
  // mostrársela a nadie, dejando al usuario nuevo sin forma de iniciar
  // sesión. `tempPasswordInfo` guarda lo que hay que mostrarle al
  // Administrador una sola vez, justo después de crear la cuenta.
  const [passwordInput, setPasswordInput] = useState('');
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ email: string; password: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    nombre: '',
    email: '',
    rol: UserRole.USUARIO,
    nfc: '',
    bicicletaAsignada: ''
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      // F11: `user.bicicletaAsignada` viene casi siempre vacío para
      // usuarios reales de la BD (esa columna no existe en `usuarios`,
      // ver arriba) -- la asignación real se busca en `bikes` por
      // `usuario_asignado === user.id`, para que el diálogo muestre lo
      // que de verdad está guardado en vez de parecer "sin asignar".
      const assignedBike = bikes.find(b => b.usuario_asignado === user.id);
      setFormData({ ...user, bicicletaAsignada: assignedBike?.id || '' });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        rol: UserRole.USUARIO,
        nfc: '',
        bicicletaAsignada: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setActionError('');
    setPasswordInput('');
  };

  // F11: persiste "Bicicleta Asignada (ID)" en la bicicleta elegida
  // (`bicicletas_lev.usuario_asignado`), que es donde vive de verdad esa
  // relación -- no en `usuarios`. Si el usuario ya tenía otra bicicleta
  // asignada y se cambió o se borró el campo, libera la anterior primero
  // para no dejar una asignación fantasma. Lanza si el ID de bicicleta
  // escrito no existe, en vez de guardar en silencio sin hacer nada (la
  // consulta al backend no falla si el ID no existe, solo no actualiza
  // ninguna fila).
  const syncBikeAssignment = async (userId: string) => {
    const requestedId = (formData.bicicletaAsignada || '').trim() || null;
    if (requestedId && !bikes.some(b => b.id === requestedId)) {
      throw new Error(`No existe ninguna bicicleta con ID "${requestedId}"`);
    }
    const previouslyAssigned = bikes.find(b => b.usuario_asignado === userId && b.id !== requestedId);
    if (previouslyAssigned) {
      await assignUserToBike(previouslyAssigned.id, null);
    }
    if (requestedId) {
      await assignUserToBike(requestedId, userId);
    }
  };

  const handleSaveUser = async () => {
    setActionError('');
    setSaving(true);
    try {
      if (editingUser) {
        // F10: ahora sí persiste en el backend (antes solo cambiaba el
        // estado local de React y se perdía al recargar la página).
        await updateUser(editingUser.id, formData);
        await syncBikeAssignment(editingUser.id);
        if (authUser && authUser.id === editingUser.id) {
          updateAuthUser({ ...authUser, ...formData } as User);
        }
        handleCloseDialog();
      } else {
        // Add new user
        const newUser: Partial<User> & { password?: string } = {
          id: `u${Date.now()}`,
          ...formData,
          password: passwordInput || undefined,
        };
        const created = await addUser(newUser);
        if (created) {
          await syncBikeAssignment(created.id);
        }
        handleCloseDialog();
        // F6: si el backend generó una contraseña temporal (porque se dejó
        // el campo vacío), se muestra UNA sola vez -- antes se generaba y
        // se perdía en silencio, sin que nadie pudiera dársela al usuario.
        if (created?.temp_password) {
          setTempPasswordInfo({ email: created.email, password: created.temp_password });
        }
      }
    } catch (err: any) {
      // Se deja el diálogo abierto para que pueda corregir y reintentar.
      setActionError(err?.message || 'No se pudo guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      setActionError('');
      try {
        // F10: ahora sí elimina en el backend (antes solo desaparecía de
        // la tabla en pantalla y volvía a aparecer al recargar).
        await deleteUser(userToDelete);
      } catch (err: any) {
        setActionError(err?.message || 'No se pudo eliminar el usuario');
      }
      setUserToDelete(null);
    }
    setConfirmDeleteOpen(false);
  };

  // F1: aprueba una cuenta que se auto-registró desde pages/Register.tsx y
  // sigue pendiente (aprobado === false) -- hasta que esto pasa, esa
  // persona no puede iniciar sesión (server/index.js POST /api/auth/login
  // la rechaza con 403).
  const handleApprove = async (id: string) => {
    await approveUser(id);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.grayDark }}>
          Control de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          sx={{ bgcolor: COLORS.ipnGuinda, '&:hover': { bgcolor: '#601830' } }}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {actionError && !openDialog && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>NFC ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
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
                        color={user.rol === UserRole.ADMIN ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{user.nfc || 'N/A'}</TableCell>
                    <TableCell>
                      {/* F1: user.aprobado === false son cuentas auto-registradas
                          (pages/Register.tsx) que todavía no pueden iniciar sesión. */}
                      {user.aprobado === false ? (
                        <Chip label="Pendiente de aprobación" size="small" sx={{ bgcolor: `${COLORS.yellowMaint}30`, color: '#9a6b00', fontWeight: 'bold' }} />
                      ) : (
                        <Chip label="Activo" size="small" sx={{ bgcolor: `${COLORS.greenActive}20`, color: COLORS.greenActive, fontWeight: 'bold' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {isAdmin && user.aprobado === false && (
                        <IconButton size="small" color="success" onClick={() => handleApprove(user.id)} title="Aprobar cuenta">
                          <HowToReg />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                        <Edit />
                      </IconButton>
                      {/* F10: no se ofrece eliminarse a sí mismo -- mismo
                          resguardo que ya aplica el backend (evita quedarse
                          sin sesión ni forma de recuperar acceso admin). */}
                      {authUser?.id !== user.id && (
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(user.id)}>
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent dividers>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Rol"
                value={formData.rol || UserRole.USUARIO}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as UserRole })}
              >
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Tarjeta NFC"
                value={formData.nfc}
                onChange={(e) => setFormData({ ...formData, nfc: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bicicleta Asignada (ID)"
                value={formData.bicicletaAsignada}
                onChange={(e) => setFormData({ ...formData, bicicletaAsignada: e.target.value })}
              />
            </Grid>
            {/* F6: solo al dar de alta -- editar contraseña es un flujo
                aparte que no existe todavía. Si se deja vacío, el backend
                genera una temporal y se muestra una sola vez al guardar. */}
            {!editingUser && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contraseña (opcional)"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  helperText="Si se deja vacío, el sistema genera una temporal y te la muestra al guardar"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />} color="inherit" disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveUser} startIcon={<Save />} variant="contained" sx={{ bgcolor: COLORS.ipnGuinda }} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* F6: contraseña temporal generada por el backend -- se muestra UNA
          sola vez, justo después de crear el usuario. El backend nunca la
          vuelve a devolver después de este momento (no queda en texto plano
          en ningún otro endpoint), así que si se cierra sin copiarla hay que
          restablecerla aparte. */}
      <Dialog open={!!tempPasswordInfo} onClose={() => setTempPasswordInfo(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Contraseña temporal generada</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta contraseña solo se muestra una vez. Compártela con {tempPasswordInfo?.email} para que pueda iniciar sesión.
          </Alert>
          <TextField
            fullWidth
            label="Contraseña temporal"
            value={tempPasswordInfo?.password || ''}
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<ContentCopy />}
            onClick={() => tempPasswordInfo && navigator.clipboard?.writeText(tempPasswordInfo.password)}
          >
            Copiar
          </Button>
          <Button variant="contained" sx={{ bgcolor: COLORS.ipnGuinda }} onClick={() => setTempPasswordInfo(null)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
