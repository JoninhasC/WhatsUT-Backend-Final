import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui';
import { 
  Bell, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Shield,
  Trash2,
  LogOut
} from 'lucide-react';

function SettingsPage() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    sounds: true,
    readReceipts: true,
    onlineStatus: true
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    // Aqui seria salvo no localStorage ou enviado para API
    localStorage.setItem(`whatsut_setting_${key}`, JSON.stringify(value));
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.')) {
      // Limpar dados do localStorage (manter apenas auth)
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('whatsut_messages_') || key.startsWith('whatsut_chats_')) {
          localStorage.removeItem(key);
        }
      });
      alert('Dados locais limpos com sucesso!');
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
            <p className="text-gray-600">Personalize sua experiência no WhatsUT</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              {/* Aparência */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Sun className="w-5 h-5" />
                  <span>Aparência</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Tema</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSettingChange('theme', 'light')}
                        className={`p-2 rounded-lg transition-colors ${
                          settings.theme === 'light' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSettingChange('theme', 'dark')}
                        className={`p-2 rounded-lg transition-colors ${
                          settings.theme === 'dark' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notificações */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notificações</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Receber notificações</span>
                    <button
                      onClick={() => handleSettingChange('notifications', !settings.notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Sons de notificação</span>
                    <button
                      onClick={() => handleSettingChange('sounds', !settings.sounds)}
                      className="text-gray-600 hover:text-green-600 transition-colors"
                    >
                      {settings.sounds ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacidade */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Privacidade</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Confirmação de leitura</span>
                    <button
                      onClick={() => handleSettingChange('readReceipts', !settings.readReceipts)}
                      className="text-gray-600 hover:text-green-600 transition-colors"
                    >
                      {settings.readReceipts ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Status online</span>
                    <button
                      onClick={() => handleSettingChange('onlineStatus', !settings.onlineStatus)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.onlineStatus ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.onlineStatus ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dados */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Trash2 className="w-5 h-5" />
                  <span>Dados</span>
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleClearData}
                    className="w-full py-2 px-4 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-left"
                  >
                    Limpar dados locais (mensagens e chats)
                  </button>
                  <p className="text-xs text-gray-500">
                    Remove todas as mensagens e chats salvos localmente. Não afeta sua conta.
                  </p>
                </div>
              </div>

              {/* Conta */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <LogOut className="w-5 h-5" />
                  <span>Conta</span>
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-left"
                  >
                    Sair da conta
                  </button>
                </div>
              </div>

              {/* Informações */}
              <div className="text-center text-gray-500 text-sm pt-4 border-t">
                <p>WhatsUT v1.0.0</p>
                <p>Sistema de mensagens universitário</p>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SettingsPage;
