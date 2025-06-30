import { Card, CardHeader, CardContent } from '../components/ui';

function SettingsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-gray-700">Tema:</span>
              <span className="ml-2 text-gray-900">(em breve)</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Notificações:</span>
              <span className="ml-2 text-gray-900">(em breve)</span>
            </div>
            {/* Adicione mais configurações conforme necessário */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
