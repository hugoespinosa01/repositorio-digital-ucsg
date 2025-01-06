import React from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { clearPermissions } from '@/utils/clearPermissions'

export function LogoutButton() {
    async function keycloakSessionLogOut() {
        try {
            await fetch(`/api/auth/logout`, { method: 'GET' });
        } catch (err) {
            console.error(err);
        }
    }
    return (
        <div>
            <Button
                variant={'secondary'}
                size={'sm'}
                onClick={() => {
                    keycloakSessionLogOut().then(() => signOut({ callbackUrl: '/' }))
                    //clearPermissions();
                }}
            >Cerrar sesión
                <LogOut className="ml-2 w-4 h-4" />
            </Button>
        </div>
    )
}
