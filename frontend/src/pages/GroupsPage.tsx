import { useEffect } from 'react';
import { groupService } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Card, CardHeader, CardContent } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';

function GroupsPage() {
  const { groups, setGroups, isLoading, setIsLoading } = useAppStore();

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const data = await groupService.getGroups();
        setGroups(data);
      } catch (e) {
        // Tratar erro
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, [setGroups, setIsLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Grupos</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner message="Carregando grupos..." />
          ) : (
            <ul className="divide-y divide-gray-200">
              {groups.map((group) => (
                <li key={group.id} className="py-3 flex items-center">
                  <span className="font-medium text-gray-900">{group.name}</span>
                  <span className="ml-2 text-xs text-gray-500">({group.id})</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GroupsPage;
