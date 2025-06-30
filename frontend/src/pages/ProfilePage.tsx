import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui';
import { User, Calendar, Shield, Edit3, Save, X } from 'lucide-react';

function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">Usuário não autenticado.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveEdit = () => {
    // Aqui seria feita a chamada para a API para atualizar o perfil
    console.log('Salvando perfil:', editedName);
    setIsEditing(false);
    // TODO: Implementar atualização real via API
  };

  const handleCancelEdit = () => {
    setEditedName(user.name);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
              <p className="text-gray-600">Gerencie suas informações pessoais</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Nome:</span>
                    {isEditing ? (
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Digite seu nome"
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-900 mt-1">{user.name}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <p className="text-green-600 font-medium mt-1">
                      Online
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações da conta */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Informações da Conta</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Membro desde:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-900">
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                          : 'Data não disponível'
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tipo de conta:</span>
                    <p className="text-gray-900 mt-1">Usuário padrão</p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <button className="w-full py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    Alterar Foto do Perfil
                  </button>
                  <button className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    Alterar Senha
                  </button>
                  <button className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                    Excluir Conta
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
