'use client';
import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { IdCard, Mail, School } from 'lucide-react';
import { Input } from '../ui/input';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import GetBackButton from '../getback-button';


interface UserInfo {
  name: string;
  email: string;
  career: string;
  identification: string;
}

export default function AccountDetails() {

  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    email: '',
    career: '',
    identification: ''
  })
  const { data: session } = useSession();

  useEffect(() => {
    setUserInfo({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      career: session?.user.carrera.join() || '',
      identification: session?.user.cedula || ''
    })
  }, [])

  return (
    <Card className='p-5 mt-5'>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold mb-4">
            Información del usuario
          </h1>
          <GetBackButton />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <Input
                    readOnly
                    value={userInfo.name.toUpperCase()}
                  />
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
                    readOnly
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
                    readOnly
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
                    readOnly
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
