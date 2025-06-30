import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

function UsersPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getUsers();
        // Filtrar o usuário atual da lista
        const otherUsers = data.filter((u: any) => u.id !== currentUser?.id);
        setUsers(otherUsers);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleStartChat = (user: User) => {
    // Navegar para o chat com este usuário
    navigate(`/chat/${user.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">Usuários Online</h2>
            <p className="text-gray-600">Usuários disponíveis para conversar</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8">
                <LoadingSpinner message="Carregando usuários..." />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500">
                          {user.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartChat(user)}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Iniciar Conversa</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UsersPage;
