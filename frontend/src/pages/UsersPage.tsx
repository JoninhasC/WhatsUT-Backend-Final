import { useEffect } from 'react';
import { userService } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Card, CardHeader, CardContent } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';

function UsersPage() {
  const { users, setUsers, isLoading, setIsLoading } = useAppStore();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getUsers();
        setUsers(data);
      } catch (e) {
        // Tratar erro
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [setUsers, setIsLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Usuários</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner message="Carregando usuários..." />
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="py-3 flex items-center">
                  <span className="font-medium text-gray-900">{user.name}</span>
                  <span className="ml-2 text-xs text-gray-500">({user.id})</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UsersPage;
