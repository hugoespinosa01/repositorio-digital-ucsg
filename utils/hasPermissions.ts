// Utilidad para verificar permisos
import useAuthRoles  from '@/hooks/useAuthRoles';

export const hasPermission = (resource: string, action: string ) => {

    const {permissions} = useAuthRoles(true);

    return permissions.some(
        (perm) => perm.rsname === resource && perm.scopes.includes(`scope:${action}`)
    );
};