'use cache';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

interface Permissions {
    scopes : string[];
    rsname : string;
    rsid: string;
}

function useAuthRoles(autoFetch = false) {
    const [permissions, setPermissions] = useState<Permissions[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchPermissions = useCallback(async () => {
        setLoading(true); // Indica que la solicitud ha comenzado
        setError(null); // Resetea cualquier error previo
        try {
            const res = await fetch('/api/auth/permissions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`Error al obtener los roles: ${res.statusText}`);
            }

            const data = await res.json();
            setPermissions(data.data.permissions || []); // Asegúrate de manejar casos donde `data.data` sea `undefined`
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            console.error(err);
            router.push('/unAuthorized'); // Redirige a la página de inicio en caso de error
        } finally {
            setLoading(false); // Indica que la solicitud ha terminado
        }
    }, []);

    // Llama a fetchPermissions automáticamente si autoFetch es verdadero
    useEffect(() => {
        if (autoFetch) {
            fetchPermissions();
        }
    }, [autoFetch, fetchPermissions]);

    return { permissions, fetchPermissions, loading, error };
}

export default useAuthRoles;
