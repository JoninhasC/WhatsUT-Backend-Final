import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, MessageCircle } from 'lucide-react';
import type { Group } from '../types';

function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const data = await groupService.getGroups();
        setGroups(data);
      } catch (error) {
        console.error('Erro ao carregar grupos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleJoinGroup = (group: Group) => {
    // Navegar para o chat do grupo
    navigate(`/chat/${group.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Grupos Disponíveis</h2>
                <p className="text-gray-600">Participe de grupos de estudo e discussões</p>
              </div>
              <button
                onClick={() => navigate('/create-group')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Criar Grupo</span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8">
                <LoadingSpinner message="Carregando grupos..." />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhum grupo encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                        <Users className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {group.members?.length || 0} membros
                        </p>
                        <p className="text-sm text-gray-500">
                          Criado em {new Date(group.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleJoinGroup(group)}
                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Users className="w-4 h-4" />
                        <span>Entrar no Grupo</span>
                      </button>
                      
                      <button
                        onClick={() => handleJoinGroup(group)}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Ver Mensagens</span>
                      </button>
                    </div>
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

export default GroupsPage;
