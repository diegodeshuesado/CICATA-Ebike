import { useState, useEffect } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
import { api } from '../services/api';

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);

    const loadUsers = async () => {
        const dbUsers = await api.getUsers();
        if (dbUsers && dbUsers.length > 0) {
            setUsers(dbUsers);
            localStorage.setItem('users', JSON.stringify(dbUsers));
        } else {
            const saved = localStorage.getItem('users');
            if (saved) {
                setUsers(JSON.parse(saved));
            } else {
                setUsers(MOCK_USERS);
            }
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // F6: devuelve el usuario creado (incluyendo `temp_password` si el
    // backend generó una contraseña temporal porque no se mandó ninguna)
    // para que pages/UsersPage.tsx pueda mostrársela al Administrador --
    // antes se generaba y se perdía en silencio, dejando al usuario nuevo
    // sin forma de iniciar sesión.
    const addUser = async (user: Partial<User> & { password?: string }): Promise<(User & { temp_password?: string }) | null> => {
        try {
            const created = await api.createUser(user);
            setUsers(prev => [...prev, created]);
            return created;
        } catch (err) {
            console.error('Error al guardar en BD, guardando localmente:', err);
            setUsers(prev => [...prev, user as User]);
            return null;
        }
    };

    // F10: antes esto solo cambiaba el estado local de React -- no existía
    // ni el método en `api` ni el endpoint en el backend, así que la edición
    // se perdía al recargar la página. Ahora persiste de verdad; si el
    // backend la rechaza (p. ej. correo duplicado), se relanza el error para
    // que la pantalla lo muestre en vez de fingir que se guardó.
    const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
        const saved = await api.updateUser(id, updates);
        setUsers(prev => prev.map(u => u.id === id ? saved : u));
    };

    const deleteUser = async (id: string): Promise<void> => {
        await api.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    // F1: aprueba una cuenta auto-registrada (pages/Register.tsx) para que
    // pueda iniciar sesión -- ver server/index.js PUT /api/users/:id/aprobar.
    const approveUser = async (id: string): Promise<boolean> => {
        const ok = await api.approveUser(id);
        if (ok) {
            setUsers(prev => prev.map(u => u.id === id ? { ...u, aprobado: true } : u));
        }
        return ok;
    };

    return {
        users,
        setUsers,
        addUser,
        updateUser,
        deleteUser,
        approveUser,
        reloadUsers: loadUsers,
    };
};
