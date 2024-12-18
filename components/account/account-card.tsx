'use client';
import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { IdCard, Mail, School } from 'lucide-react';
import { Input } from '../ui/input';
import { useContext, useState } from 'react';
import { AuthContext } from '@/context/auth-context';

interface UserInfo {
  given_name: string;
  email: string;
  familyName: string;
  career: string;
  identification: string;
}

export default function AccountDetails() {

  const [userInfo, setUserInfo] = useState<UserInfo>({
    given_name: '',
    email: '',
    familyName: '',
    career: '',
    identification: ''
  })

  const { keycloak } = useContext(AuthContext);

  useEffect(() => {
    if (keycloak) {
      setUserInfo({
        given_name: keycloak.tokenParsed?.given_name,
        email: keycloak.tokenParsed?.email,
        familyName: keycloak.tokenParsed?.family_name,
        career: keycloak.tokenParsed?.carrera,
        identification: keycloak.tokenParsed?.cedula
      })
    }
  }, [keycloak])

  console.log(keycloak?.tokenParsed);
  

  return (
    <Card className='p-5 mt-5'>
      <CardHeader>
        <CardTitle>Información del usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <Input
                      disabled
                      value={userInfo.given_name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <Input
                      disabled
                      value={userInfo.familyName}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <IdCard size={16} />
                      Cédula
                    </div>
                  </label>
                  <Input
                    value={userInfo.identification}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      Correo electrónico
                    </div>
                  </label>
                  <Input
                    type='email'
                    value={userInfo.email}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <School size={16} />
                      Carrera
                    </div>
                  </label>
                  <Input
                    disabled
                    value={userInfo.career}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
