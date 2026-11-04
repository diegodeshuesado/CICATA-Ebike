import { useState, useEffect } from 'react';
import { Bike, BikeStatus } from '../types';
import { MOCK_BIKES } from '../constants';
import { api } from '../services/api';

export const useBikes = () => {
    const [bikes, setBikes] = useState<Bike[]>([]);

    const loadBikes = async () => {
        const dbBikes = await api.getBikes();
        if (dbBikes && dbBikes.length > 0) {
            setBikes(dbBikes);
            localStorage.setItem('bikes', JSON.stringify(dbBikes));
        } else {
            const savedBikes = localStorage.getItem('bikes');
            setBikes(savedBikes ? JSON.parse(savedBikes) : MOCK_BIKES);
        }
    };

    useEffect(() => {
        loadBikes();

        // F2: antes la lista de bicicletas se cargaba una sola vez al montar
        // y el "movimiento en vivo" del mapa (FleetMap.tsx) era en realidad
        // un jitter aleatorio con Math.random(), sin relación con datos
        // reales. Ahora que bike.ubicacion/bateria/etc. vienen de telemetría
        // real (o simulada, en modo demo), se vuelve a pedir la lista
        // periódicamente para que la UI refleje esos cambios de verdad.
        const interval = setInterval(loadBikes, 5000);
        return () => clearInterval(interval);
    }, []);

    const updateBikeStatus = async (id: string, newStatus: BikeStatus) => {
        setBikes(prevBikes =>
            prevBikes.map(bike =>
                bike.id === id ? { ...bike, estado: newStatus } : bike
            )
        );
        try {
            await api.updateBike(id, { estado: newStatus });
        } catch (err) {
            console.error('Error al actualizar bicicleta en BD:', err);
        }
    };

    const addBike = async (newBikeData: Partial<Bike>) => {
        try {
            const created = await api.createBike(newBikeData);
            setBikes(prev => [...prev, created]);
        } catch (err) {
            console.error('Error al añadir bicicleta en BD:', err);
        }
    };

    const getBikeById = (id: string) => {
        return bikes.find(b => b.id === id);
    };

    // F11: antes "Bicicleta Asignada (ID)" en el diálogo de Usuarios
    // (pages/UsersPage.tsx) se podía escribir pero nunca se guardaba en
    // ningún lado -- la relación real vive al revés, en
    // `bicicletas_lev.usuario_asignado` (server/schema.sql), no en
    // `usuarios`. Esta función persiste esa asignación de verdad; deja
    // que el error se propague para que la pantalla lo muestre.
    const assignUserToBike = async (bikeId: string, userId: string | null): Promise<void> => {
        await api.updateBike(bikeId, { usuario_asignado: userId } as Partial<Bike>);
        setBikes(prev => prev.map(b => b.id === bikeId ? { ...b, usuario_asignado: userId } : b));
    };

    return {
        bikes,
        setBikes,
        updateBikeStatus,
        addBike,
        getBikeById,
        assignUserToBike,
        reloadBikes: loadBikes,
    };
};
