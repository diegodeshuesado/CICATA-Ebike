
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Link as MuiLink, Grid, Alert, Fade, Chip, CircularProgress
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { COLORS } from '../constants';
import { Security, School, Info } from '@mui/icons-material';
import { api } from '../services/api';

const Register: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nfc, setNfc] = useState('');
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // F1: antes este formulario no llamaba a ningún endpoint -- solo hacía
  // alert() y redirigía a /login, sin crear nada en la base de datos. Ahora
  // sí crea la cuenta de verdad (POST /api/auth/register), pero pendiente
  // de aprobación; `success` controla la pantalla de confirmación en vez
  // de un alert() del navegador.
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Lógica de detección automática de rol por correo (mismo criterio que
  // usa el servidor en server/index.js `detectRoleFromEmail` -- el servidor
  // es quien decide de verdad el rol al registrar, esto es solo para
  // mostrarle al usuario qué esperar antes de enviar el formulario).
  useEffect(() => {
    if (email.toLowerCase().endsWith('@ipn.mx')) {
      setDetectedRole('Investigador');
    } else if (email.toLowerCase().endsWith('@alumno.ipn.mx')) {
      setDetectedRole('Usuario Bicicleta');
    } else if (email.includes('@')) {
      setDetectedRole('Dominio no reconocido');
    } else {
      setDetectedRole(null);
    }
  }, [email]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (detectedRole === 'Dominio no reconocido' || !detectedRole) {
      setError('Por favor use un correo institucional válido (@ipn.mx o @alumno.ipn.mx)');
      return;
    }
    if (!nombre.trim() || !apellidos.trim()) {
      setError('Nombre y apellidos son requeridos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (detectedRole === 'Usuario Bicicleta' && !nfc.trim()) {
      setError('El ID de tarjeta NFC es requerido para cuentas de Usuario Bicicleta');
      return;
    }

    setLoading(true);
    try {
      await api.register({
        nombre: `${nombre.trim()} ${apellidos.trim()}`,
        email,
        password,
        nfc_token: detectedRole === 'Usuario Bicicleta' ? nfc.trim() : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'No se pudo completar el registro. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2
      }}>
        <Card sx={{ maxWidth: 500, width: '100%', p: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Security sx={{ fontSize: 56, color: COLORS.blueInfo, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Solicitud registrada
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Tu cuenta como <strong>{detectedRole}</strong> quedó creada, pero antes de poder iniciar sesión un
              Administrador debe aprobarla desde el panel de Usuarios. Te avisarán cuando esté lista.
            </Typography>
            <Button variant="contained" fullWidth sx={{ bgcolor: COLORS.ipnGuinda }} onClick={() => navigate('/login')}>
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#f5f5f5',
      p: 2
    }}>
      <Card sx={{ maxWidth: 600, width: '100%', overflow: 'visible' }}>
        <Box sx={{ 
          bgcolor: COLORS.ipnGuinda, 
          height: 80, 
          mt: -4, 
          mx: 4, 
          borderRadius: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: 3
        }}>
          <Typography variant="h5" color="white" sx={{ fontWeight: 'bold' }}>
            Registro de Usuario
          </Typography>
        </Box>

        <CardContent sx={{ pt: 4, px: 4 }}>
          <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
            El sistema asignará su rol automáticamente basándose en su correo institucional.
          </Alert>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleRegister}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre(s)"
                  variant="outlined"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos"
                  variant="outlined"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Correo Institucional" 
                  variant="outlined" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@ipn.mx o ejemplo@alumno.ipn.mx"
                  helperText="Use @ipn.mx para personal/investigador o @alumno.ipn.mx para estudiantes"
                />
              </Grid>

              {/* Visualización del Rol Detectado */}
              {detectedRole && (
                <Grid item xs={12}>
                  <Fade in={true}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: detectedRole === 'Dominio no reconocido' ? '#fff5f5' : '#f0f7ff',
                      border: `1px solid ${detectedRole === 'Dominio no reconocido' ? COLORS.redInactive : COLORS.blueInfo}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {detectedRole === 'Investigador' ? <Security sx={{ color: COLORS.blueInfo, mr: 1 }} /> : <School sx={{ color: COLORS.blueInfo, mr: 1 }} />}
                        <Box>
                          <Typography variant="caption" color="textSecondary">Rol Detectado:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: detectedRole === 'Dominio no reconocido' ? COLORS.redInactive : COLORS.blueInfo }}>
                            {detectedRole}
                          </Typography>
                        </Box>
                      </Box>
                      {detectedRole !== 'Dominio no reconocido' && (
                        <Chip label="Asignado" size="small" color="primary" sx={{ bgcolor: COLORS.blueInfo }} />
                      )}
                    </Box>
                  </Fade>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  variant="outlined"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Mínimo 6 caracteres"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  type="password"
                  variant="outlined"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword.length > 0 && confirmPassword !== password}
                  helperText={confirmPassword.length > 0 && confirmPassword !== password ? 'No coincide' : ' '}
                />
              </Grid>

              {detectedRole === 'Usuario Bicicleta' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ID Tarjeta NFC"
                    variant="outlined"
                    required
                    value={nfc}
                    onChange={(e) => setNfc(e.target.value)}
                    helperText="Ingrese el ID físico de su credencial de alumno"
                  />
                </Grid>
              )}
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !detectedRole || detectedRole === 'Dominio no reconocido'}
              sx={{ mt: 4, mb: 2, bgcolor: COLORS.ipnGuinda }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Solicitar Registro'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              ¿Ya tienes cuenta? <MuiLink component={RouterLink} to="/login" color="primary" sx={{ fontWeight: 'bold', textDecoration: 'none' }}>Inicia sesión</MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
