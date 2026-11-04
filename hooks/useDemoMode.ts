import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// Hook para leer/cambiar el modo demo del sistema (D1, PLAN_MEJORAS.md).
// El estado real vive en el backend (en memoria, ver server/index.js);
// este hook solo lo sincroniza para la UI -- en particular el interruptor
// que se muestra en Layout.tsx (solo a usuarios con rol Administrador).
export const useDemoMode = () => {
  const [enabled, setEnabledState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    api.getDemoMode().then((result) => {
      if (cancelled) return;
      if (result) setEnabledState(result.enabled);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const setEnabled = useCallback(async (value: boolean) => {
    // Optimista: refleja el cambio de inmediato en la UI; si el backend
    // lo rechaza (p. ej. no autorizado), se revierte al valor anterior.
    setEnabledState(value);
    const result = await api.setDemoMode(value);
    if (result) {
      setEnabledState(result.enabled);
    } else {
      setEnabledState(!value); // revertir: la petición falló
    }
  }, []);

  return { enabled, setEnabled, loading };
};
