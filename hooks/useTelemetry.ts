import { useState, useEffect, useRef } from 'react';
import { api, InfluxTelemetryData, authedEventSourceUrl } from '../services/api';

export interface TelemetryState extends InfluxTelemetryData {
  isOffline?: boolean;
}

export const useTelemetry = (
  bikeId: string = 'ebike1',
  range: string = '-30s',
  pollingIntervalMs: number = 1000,
  // F4: número de muestras a pedir dentro de `range` (1 = solo la más
  // reciente, que es lo que ya usaban ScadaPage y F2/getBikes). BikeDetails
  // lo sube para poder graficar/tabular un historial real en vez de un
  // solo punto repetido -- ver services/api.ts `getTelemetry`.
  sampleLimit: number = 1
) => {
  const [telemetryList, setTelemetryList] = useState<InfluxTelemetryData[]>([]);
  const [latestReading, setLatestReading] = useState<TelemetryState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);
  const lastPacketTimeRef = useRef<number>(0);

  // Función sanitizadora de valores eléctricos
  const sanitizeReading = (reading: Partial<InfluxTelemetryData>): TelemetryState => {
    let v_bus = typeof reading.v_bus === 'number' ? reading.v_bus : 0;
    let i_motor = typeof reading.i_motor === 'number' ? reading.i_motor : 0;
    let potencia_w = typeof reading.potencia_w === 'number' ? reading.potencia_w : (v_bus * i_motor);
    let temp_motor = typeof reading.temp_motor === 'number' ? reading.temp_motor : 0;
    let pitch = typeof reading.pitch === 'number' ? reading.pitch : 0;
    let roll = typeof reading.roll === 'number' ? reading.roll : 0;
    let acel_x = typeof reading.acel_x === 'number' ? reading.acel_x : 0;
    // F9: velocidad_ms ya no se aproxima desde acel_x (eran magnitudes
    // físicas distintas mezcladas por un fallback del backend que se
    // quitó) -- se pasa tal cual venga (o 0 si no hay dato real).
    let velocidad_ms = typeof reading.velocidad_ms === 'number' ? reading.velocidad_ms : 0;

    // Regla 2: Si v_bus < 5V (sistema apagado o desconectado), corriente y potencia caen a 0
    if (v_bus < 5.0) {
      i_motor = 0;
      potencia_w = 0;
    } else {
      if (i_motor < 0) i_motor = 0;
      if (potencia_w < 0) potencia_w = 0;
    }

    return {
      ...reading,
      _time: reading._time || new Date().toISOString(),
      v_bus,
      i_motor,
      potencia_w,
      temp_motor,
      pitch,
      roll,
      acel_x,
      velocidad_ms,
      latitud: reading.latitud ?? 20.5896,
      longitud: reading.longitud ?? -100.3780,
      isOffline: false,
    };
  };

  const getZeroReading = (): TelemetryState => ({
    _time: new Date().toISOString(),
    v_bus: 0,
    i_motor: 0,
    potencia_w: 0,
    temp_motor: 0,
    pitch: 0,
    roll: 0,
    acel_x: 0,
    velocidad_ms: 0,
    latitud: 20.5896,
    longitud: -100.3780,
    isOffline: true,
  });

  useEffect(() => {
    let isMounted = true;

    const doFetch = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const rawData = await api.getTelemetry(bikeId, range, sampleLimit);
        if (isMounted && Array.isArray(rawData) && rawData.length > 0) {
          const latestData: InfluxTelemetryData = rawData.reduce((prev, current) =>
            new Date(current._time).getTime() > new Date(prev._time).getTime() ? current : prev
          );

          if (latestData && latestData._time) {
            const sampleTime = new Date(latestData._time).getTime();
            const ageMs = Date.now() - sampleTime;

            // Validación de timeout (> 3 segundos sin paquetes recientes)
            if (ageMs > 3000) {
              setLatestReading(getZeroReading());
            } else {
              lastPacketTimeRef.current = Date.now();
              const sanitized = sanitizeReading(latestData);
              setLatestReading(sanitized);
            }
            setTelemetryList([...rawData].reverse());
            setError(null);
          }
        } else if (isMounted) {
          if (lastPacketTimeRef.current > 0 && (Date.now() - lastPacketTimeRef.current > 3000)) {
            setLatestReading(getZeroReading());
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error de sincronización');
          if (lastPacketTimeRef.current > 0 && (Date.now() - lastPacketTimeRef.current > 3000)) {
            setLatestReading(getZeroReading());
          }
        }
      } finally {
        isFetchingRef.current = false;
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    doFetch();

    const timer = setInterval(() => {
      if (lastPacketTimeRef.current > 0 && (Date.now() - lastPacketTimeRef.current > 3000)) {
        if (isMounted) {
          setLatestReading(getZeroReading());
        }
      }
      doFetch();
    }, 500);

    let eventSource: EventSource | null = null;
    try {
      // /api/influx/live ahora exige autenticación (S2); EventSource no puede
      // mandar headers, así que el token va como query param.
      eventSource = new EventSource(authedEventSourceUrl('/influx/live'));
      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const liveData: InfluxTelemetryData = JSON.parse(event.data);
          if (liveData && liveData._time) {
            const sampleTime = new Date(liveData._time).getTime();
            if (Date.now() - sampleTime <= 3000) {
              lastPacketTimeRef.current = Date.now();
              const sanitized = sanitizeReading(liveData);
              setLatestReading(sanitized);
            }
          }
        } catch (e) {}
      };
      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    } catch (e) {}

    return () => {
      isMounted = false;
      clearInterval(timer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [bikeId, range, pollingIntervalMs, sampleLimit]);

  return {
    telemetryList,
    latestReading,
    loading,
    error,
  };
};

