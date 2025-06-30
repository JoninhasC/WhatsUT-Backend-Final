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
    console.log('Salvando perfil:', editedName);
    setIsEditing(false);
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
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Digite seu nome"
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:text-green-700 transition-colors"
                          title="Salvar alterações"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Cancelar edição"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Editar nome"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">ID do Usuário</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{user.id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Ativo
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Última atividade</p>
                  <p className="font-medium text-gray-900">
                    Agora
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações da Conta</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                  🔒 Alterar Senha
                </button>
                <button className="w-full text-left p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                  🖼️ Alterar Foto de Perfil
                </button>
                <button className="w-full text-left p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                  🔐 Configurações de Privacidade
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
