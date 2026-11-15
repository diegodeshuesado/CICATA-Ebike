import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Grid, Card, CardContent, Typography, Box,
    IconButton, Button, Chip
} from '@mui/material';
import {
    ArrowBack, Speed, Warning, Thermostat, Opacity, Explore, RotateRight,
    Bolt, ElectricalServices, AccessTime
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COLORS } from '../constants';
import { useBikes } from '../hooks/useBikes';
import { useTelemetry } from '../hooks/useTelemetry';

// Fix for default marker icon
const customMarker = (color: string) => {
    const markerHtmlStyles = `
    background-color: ${color};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -1rem;
    top: -1rem;
    position: relative;
    border-radius: 2rem 2rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF;
  `;

    return L.divIcon({
        className: "my-custom-pin",
        iconAnchor: [0, 24],
        popupAnchor: [0, -36],
        html: `<span style="${markerHtmlStyles}" />`
    });
};

// Componente para recentrar dinámicamente el mapa Leaflet cuando cambien las coordenadas
const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
};

// Parseo defensivo a prueba de errores para formatear valores numéricos (soporta números negativos)
const safeFormat = (val: any, decimals: number = 1, fallback: string = '--'): string => {
    const num = Number(val);
    return !isNaN(num) && val !== null && val !== undefined ? num.toFixed(decimals) : fallback;
};

const ScadaPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const bikeId = id || 'ebike1';

    const { getBikeById } = useBikes();
    const bike = getBikeById(bikeId) || { id: bikeId, modelo: 'E-Bike LEV', estado: 'activa', ubicacion: { lat: 20.5896, lng: -100.3780 } };

    // Consumo en vivo de InfluxDB mediante polling cada 1000 ms (1 segundo) para baja latencia
    const { latestReading } = useTelemetry(bikeId, '-30s', 1000);

    const timeString = latestReading?._time ? new Date(latestReading._time).toLocaleTimeString() : '--:--:--';

    // Mapeo directo con sintaxis alternativas aceptadas sin envolver en filtros que descarten números negativos
    const v_bus = latestReading?.v_bus ?? (latestReading as any)?.voltaje;
    const i_motor = latestReading?.i_motor ?? (latestReading as any)?.corriente;
    const potencia_w = latestReading?.potencia_w ?? (latestReading as any)?.potencia ?? (v_bus !== undefined && i_motor !== undefined ? Number(v_bus) * Number(i_motor) : undefined);
    const temp_motor = latestReading?.temp_motor ?? (latestReading as any)?.temperatura;
    const pitch = latestReading?.pitch;
    const roll = latestReading?.roll ?? (latestReading as any)?.roll_deg;
    const acel_x = latestReading?.acel_x ?? (latestReading as any)?.aceleracion;
    // F9: antes `velocidad`/`rpm` se aproximaban desde `acel_x * 3.6` -- una
    // conversión sin base física real, heredada de que `acel_x` a veces en
    // realidad contenía `velocidad_ms` por un fallback del backend (ya
    // quitado, ver server/index.js). Ahora se usa el campo real
    // `velocidad_ms` directo.
    const velocidad_ms = latestReading?.velocidad_ms;

    // Coordenadas GNSS
    const rawLat = latestReading?.latitud ?? (latestReading as any)?.gps_lat ?? (latestReading as any)?.lat;
    const rawLng = latestReading?.longitud ?? (latestReading as any)?.gps_lng ?? (latestReading as any)?.lng;

    const lat = (rawLat !== undefined && rawLat !== null && rawLat !== 0 && !isNaN(Number(rawLat))) ? Number(rawLat) : 20.5896;
    const lng = (rawLng !== undefined && rawLng !== null && rawLng !== 0 && !isNaN(Number(rawLng))) ? Number(rawLng) : -100.3780;

    const velocidad = velocidad_ms !== undefined ? Math.abs(Number(velocidad_ms) * 3.6) : undefined;
    // El *12 sigue siendo un factor de escala aproximado (no hay un cálculo
    // real de diámetro de rueda / relación de transmisión) -- se deja igual
    // que antes, solo que ahora parte de una velocidad real en vez de una
    // aceleración mal etiquetada. Ver F9 en PLAN_MEJORAS.md.
    const rpm = velocidad !== undefined ? Math.round(velocidad * 12) : undefined;

    // Colors for values
    const getValueColor = (val?: any, type?: string) => {
        const num = Number(val);
        if (isNaN(num) || val === null || val === undefined) return COLORS.grayMedium;
        if (type === 'temp' && num > 60) return COLORS.redInactive;
        if (type === 'volt' && num < 44) return COLORS.yellowMaint;
        return COLORS.grayDark;
    };

    const MetricCard = ({ title, valueStr, unit, icon, color = COLORS.ipnGuinda, numVal, type }: any) => (
        <Card elevation={2} sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                <Box sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: `${color}15`,
                    color: color,
                    mr: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: getValueColor(numVal, type) }}>
                        {valueStr} {valueStr !== '--' && <Typography component="span" variant="caption" color="textSecondary">{unit}</Typography>}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', p: { xs: 1, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.ipnGuinda }}>
                            SCADA - {bike.id}
                        </Typography>
                        <Chip
                            label={(latestReading as any)?.isOffline || (v_bus !== undefined && Number(v_bus) < 5.0) ? "Sistema Apagado / Timeout" : "Telemetría en Vivo"}
                            color={(latestReading as any)?.isOffline || (v_bus !== undefined && Number(v_bus) < 5.0) ? "default" : "success"}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>
                    <Typography variant="subtitle1" color="textSecondary">
                        Supervisión y Adquisición de Datos en Tiempo Real (InfluxDB)
                    </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="outlined" startIcon={<Warning />} color="error">
                    Reportar Fallo
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Metrics bound to InfluxDB fields with alternative syntax fallbacks */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Tiempo (Última Act.)"
                        valueStr={timeString}
                        unit=""
                        icon={<AccessTime />}
                        color={COLORS.blueInfo}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Voltaje (v_bus)"
                        valueStr={safeFormat(v_bus, 1)}
                        unit="V"
                        numVal={v_bus}
                        icon={<Bolt />}
                        color={COLORS.ipnGuinda}
                        type="volt"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Corriente (i_motor)"
                        valueStr={safeFormat(i_motor, 1)}
                        unit="A"
                        numVal={i_motor}
                        icon={<ElectricalServices />}
                        color={COLORS.yellowMaint}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Potencia (potencia_w)"
                        valueStr={safeFormat(potencia_w, 1)}
                        unit="W"
                        numVal={potencia_w}
                        icon={<Bolt />}
                        color={COLORS.greenActive}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Aceleración (acel_x)"
                        valueStr={safeFormat(acel_x, 2)}
                        unit="m/s²"
                        numVal={acel_x}
                        icon={<Speed sx={{ transform: 'rotate(90deg)' }} />}
                        color={COLORS.blueInfo}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Temperatura (temp_motor)"
                        valueStr={safeFormat(temp_motor, 1)}
                        unit="°C"
                        numVal={temp_motor}
                        icon={<Thermostat />}
                        color={COLORS.redInactive}
                        type="temp"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Inclinación Pitch"
                        valueStr={safeFormat(pitch, 1)}
                        unit="°"
                        numVal={pitch}
                        icon={<Opacity />}
                        color={COLORS.blueInfo}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="RPM Motor"
                        valueStr={safeFormat(rpm, 0)}
                        unit="rpm"
                        numVal={rpm}
                        icon={<RotateRight />}
                        color={COLORS.yellowMaint}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Pitch (Sensor X)"
                        valueStr={safeFormat(pitch, 1)}
                        unit="°"
                        numVal={pitch}
                        icon={<Explore />}
                        color={COLORS.grayDark}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Roll (Sensor Y)"
                        valueStr={safeFormat(roll, 1)}
                        unit="°"
                        numVal={roll}
                        icon={<Explore sx={{ transform: 'rotate(90deg)' }} />}
                        color={COLORS.grayDark}
                    />
                </Grid>

                {/* Map Section bound to GNSS latitud / longitud con recentrado dinámico */}
                <Grid item xs={12}>
                    <Card sx={{ height: 450, borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ position: 'relative', height: '100%' }}>
                            <Box sx={{
                                position: 'absolute',
                                top: 16,
                                left: 16,
                                zIndex: 1000,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                p: 1,
                                borderRadius: 1,
                                boxShadow: 1
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    Latitud: {lat.toFixed(5)} <br />
                                    Longitud: {lng.toFixed(5)}
                                </Typography>
                            </Box>
                            <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                <RecenterMap lat={lat} lng={lng} />
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker
                                    position={[lat, lng]}
                                    icon={customMarker('#6A1B31')}
                                >
                                    <Popup>
                                        {bike.id} <br /> {potencia_w !== undefined ? `${safeFormat(potencia_w, 1)} W` : '-- W'}
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ScadaPage;
