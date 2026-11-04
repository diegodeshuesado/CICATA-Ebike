import React from 'react';
import {
    Box, Typography, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { useSystemMetrics } from '../hooks/useSystemMetrics';

const SystemMetricsPage: React.FC = () => {
    const { metrics, error } = useSystemMetrics(1000);

    // D1: los campos pueden venir en null ("sin datos suficientes" -- ver
    // server/index.js GET /api/system-metrics). Antes se llamaba
    // .toFixed() directo y hubiera reventado con un TypeError apenas el
    // backend dejara de inventar números; ahora se formatea de forma seria.
    const fmt = (value: number | null | undefined, decimals: number): string =>
        value === null || value === undefined ? 'Sin datos' : value.toFixed(decimals);

    const networkMetrics = [
        { label: 'Latencia promedio', value: fmt(metrics.latencia_promedio_ms, 2), unit: 'ms' },
        { label: 'Latencia máxima', value: fmt(metrics.latencia_maxima_ms, 2), unit: 'ms' },
        { label: 'Pérdida de mensajes', value: fmt(metrics.perdida_mensajes_pct, 1), unit: '%' },
        { label: 'Jitter (desviación temporal)', value: fmt(metrics.jitter_ms, 2), unit: 'ms' },
        { label: 'Error de sincronía entre fuentes', value: fmt(metrics.error_sincronia_ms, 2), unit: 'ms' },
        { label: 'Tiempo de recuperación tras fallo', value: fmt(metrics.tiempo_recuperacion_s, 1), unit: 's' },
        { label: 'Tasa de adquisición', value: fmt(metrics.tasa_adquisicion_mps, 0), unit: 'muestras/s' },
        { label: 'Throughput de datos', value: fmt(metrics.throughput_KBs, 1), unit: 'KB/s' },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    Métricas de Rendimiento del Sistema
                </Typography>
                <Chip
                    label={error ? "Servidor Desconectado" : "Telemetría en Vivo (InfluxDB)"}
                    color={error ? "error" : "success"}
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
            </Box>

            <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#7b1fa2' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Métrica</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Valor</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Unidad</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {networkMetrics.map((row) => (
                                    <TableRow key={row.label} hover>
                                        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>{row.label}</TableCell>
                                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.2rem' }}>{row.value}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>[{row.unit}]</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SystemMetricsPage;

