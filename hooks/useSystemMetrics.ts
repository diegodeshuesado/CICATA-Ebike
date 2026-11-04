import { useState, useEffect, useRef } from 'react';
import { api, SystemMetrics, authedEventSourceUrl } from '../services/api';

export const useSystemMetrics = (pollingIntervalMs: number = 1000) => {
  // D1: se arranca con todo en null ("sin datos suficientes") en vez de
  // los números fijos de antes -- ver server/index.js GET /api/system-metrics.
  // Se llenan con datos reales de InfluxDB (o de referencia, si el modo
  // demo está activo) en cuanto responde el primer fetch.
  const [metrics, setMetrics] = useState<SystemMetrics>({
    latencia_promedio_ms: null,
    latencia_maxima_ms: null,
    perdida_mensajes_pct: null,
    jitter_ms: null,
    error_sincronia_ms: null,
    tiempo_recuperacion_s: null,
    tasa_adquisicion_mps: null,
    throughput_KBs: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const data = await api.getSystemMetrics();
        if (isMounted && data) {
          setMetrics(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error de conexión');
        }
      } finally {
        isFetchingRef.current = false;
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    const timer = setInterval(() => {
      fetchMetrics();
    }, pollingIntervalMs);

    // Escuchar transmisiones SSE en vivo para sincronización ultrarrápida
    let eventSource: EventSource | null = null;
    try {
      // /api/influx/live ahora exige autenticación (S2); EventSource no puede
      // mandar headers, así que el token va como query param.
      eventSource = new EventSource(authedEventSourceUrl('/influx/live'));
      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const liveData = JSON.parse(event.data);
          if (liveData && liveData._time) {
            const now = Date.now();
            const sampleTime = new Date(liveData._time).getTime();
            const liveLat = Math.max(1, Math.min(Math.abs(now - sampleTime), 100));

            setMetrics((prev) => {
              // prev.* puede ser null si todavía no llegó ningún dato real
              // (ver default honesto de arriba, D1); en ese caso se toma
              // liveLat como punto de partida en vez de romper el cálculo.
              const prevAvg = prev.latencia_promedio_ms ?? liveLat;
              const prevMax = prev.latencia_maxima_ms ?? 0;
              return {
                ...prev,
                latencia_promedio_ms: Number(((prevAvg * 0.8) + (liveLat * 0.2)).toFixed(2)),
                latencia_maxima_ms: Math.max(prevMax, Number((liveLat * 1.5).toFixed(2))),
                timestamp: new Date().toISOString(),
              };
            });
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
  }, [pollingIntervalMs]);

  return {
    metrics,
    loading,
    error,
  };
};
