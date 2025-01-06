'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Permission {
    scopes: string[];
    rsid: string;
    rsname: string;
}

interface AuthContextValue {
    permissions: Permission[];
    loading: boolean;
    error: string | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(false); // Si no hay permisos, mostrar loading
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const res = await fetch('/api/auth/permissions', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error(`Error al obtener los permisos: ${res.statusText}`);
                }

                const data = await res.json();
                setPermissions(data.data.permissions);

                // Guardar permisos en localStorage
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        // Solo llamar a la API si no hay permisos en localStorage
        if (!permissions.length) {
            fetchPermissions();
        }
    }, []);

    return (
        <AuthContext.Provider value={{ permissions, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
