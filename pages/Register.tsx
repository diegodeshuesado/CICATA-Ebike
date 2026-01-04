
import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, TextField, 
  Button, Link as MuiLink, Grid, Alert, Fade, Chip
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { COLORS } from '../constants';
import { Security, School, Info } from '@mui/icons-material';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // Lógica de detección automática de rol por correo
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (detectedRole === 'Dominio no reconocido' || !detectedRole) {
      alert('Por favor use un correo institucional válido (@ipn.mx o @alumno.ipn.mx)');
      return;
    }
    
    // Simular registro exitoso
    alert(`Solicitud de registro como ${detectedRole} enviada. Un administrador revisará su acceso.`);
    navigate('/login');
  };

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
          
          <form onSubmit={handleRegister}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nombre(s)" variant="outlined" required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Apellidos" variant="outlined" required />
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
                <TextField fullWidth label="Contraseña" type="password" variant="outlined" required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Confirmar Contraseña" type="password" variant="outlined" required />
              </Grid>
              
              {detectedRole === 'Usuario Bicicleta' && (
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="ID Tarjeta NFC" 
                    variant="outlined" 
                    required
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
              disabled={!detectedRole || detectedRole === 'Dominio no reconocido'}
              sx={{ mt: 4, mb: 2, bgcolor: COLORS.ipnGuinda }}
            >
              Solicitar Registro
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
