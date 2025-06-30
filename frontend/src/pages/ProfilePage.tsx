import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui';

function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8 text-center">Usuário não autenticado.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-gray-700">Nome:</span>
              <span className="ml-2 text-gray-900">{user.name}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">ID:</span>
              <span className="ml-2 text-gray-500">{user.id}</span>
            </div>
            {/* Adicione mais campos conforme necessário */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
