'use client';
import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Settings, Camera, Bell, Shield, Key, CreditCard, User, Mail, Phone, School } from 'lucide-react';
import { Input } from '../ui/input';
import { useContext, useState } from 'react';
import { AuthContext } from '@/context/auth-context';

interface UserInfo {
  name: string;
  email: string;
  familyName: string;
  career: string;
}

export default function AccountDetails() {

  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    email: '',
    familyName: '',
    career: ''
  })

  const { keycloak } = useContext(AuthContext);

  useEffect(() => {
    if (keycloak) {
      setUserInfo({
        name: keycloak.tokenParsed?.name,
        email: keycloak.tokenParsed?.email,
        familyName: keycloak.tokenParsed?.family_name,
        career: keycloak.tokenParsed?.carrera
      })
    }
  }, [])

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
                      value={userInfo.name}
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
                    value={userInfo.career == 'ing_computacion' ? 'Ingeniería en Computación' : 'Ingeniería Civil'}
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
