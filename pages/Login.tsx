
import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Tabs, Tab, Checkbox, FormControlLabel,
  Link as MuiLink, CircularProgress, Alert
} from '@mui/material';
import { Contactless, Email } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PendingApprovalError } from '../services/api';
import { COLORS } from '../constants';

const Login: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err) {
      // F1: cuenta auto-registrada pendiente de aprobación por un
      // Administrador -- mensaje específico en vez del genérico de arriba.
      setError(err instanceof PendingApprovalError ? err.message : 'Credenciales incorrectas');
    }
    setLoading(false);
  };

  const handleNFCSimulation = () => {
    setLoading(true);
    setTimeout(async () => {
      // Simulate Carlos Ramírez card
      await login('usuario@ipn.mx', 'user123');
      navigate('/dashboard/user');
      setLoading(false);
    }, 2000);
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
      <Card sx={{ maxWidth: 450, width: '100%', overflow: 'visible' }}>
        <Box sx={{
          bgcolor: COLORS.ipnGuinda,
          height: 100,
          mt: -5,
          mx: 4,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 3
        }}>
          <Typography variant="h5" color="white" sx={{ fontWeight: 'bold' }}>
            Iniciar Sesión
          </Typography>
        </Box>

        <CardContent sx={{ pt: 4, px: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            <img src="/logo-cicata.png" alt="CICATA" style={{ height: 120, objectFit: 'contain' }} />
            <img src="/logo-ipn.png" alt="IPN" style={{ height: 100, objectFit: 'contain' }} />
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Email / Password" icon={<Email />} iconPosition="start" />
            <Tab label="Tarjeta NFC" icon={<Contactless />} iconPosition="start" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {tab === 0 ? (
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Correo Institucional"
                variant="outlined"
                margin="normal"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                variant="outlined"
                margin="normal"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <FormControlLabel control={<Checkbox defaultChecked />} label="Recordarme" />
                <MuiLink href="#" variant="body2" color="primary">¿Olvidaste tu contraseña?</MuiLink>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, bgcolor: COLORS.ipnGuinda }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
              </Button>
            </form>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Contactless sx={{ fontSize: 80, color: COLORS.grayMedium, mb: 2, animation: loading ? 'pulse 1.5s infinite' : 'none' }} />
              <Typography variant="body1" gutterBottom>
                Acerque su tarjeta NFC al lector
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Detectando dispositivo...
              </Typography>
              <Button
                onClick={handleNFCSimulation}
                fullWidth
                variant="outlined"
                sx={{ mt: 4 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Simular lectura NFC'}
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              ¿No tienes cuenta? <MuiLink component={RouterLink} to="/register" color="primary" sx={{ fontWeight: 'bold', textDecoration: 'none' }}>Regístrate aquí</MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default Login;
