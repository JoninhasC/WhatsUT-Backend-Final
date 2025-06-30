/**
 * ⚙️ PAINEL DE CONFIGURAÇÕES AVANÇADAS
 * 
 * Componente para configurações da aplicação incluindo
 * temas, notificações, performance e preferências.
 */

import { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Bell, 
  Volume2, 
  Monitor, 
  Smartphone, 
  Zap,
  Shield,
  Download,
  Trash2,
  X
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent } from '../ui';
import { useSettings } from '../../store/appStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    theme,
    notifications,
    sounds,
    setTheme,
    setNotifications,
    setSounds
  } = useSettings();

  const [activeSection, setActiveSection] = useState<'appearance' | 'notifications' | 'performance' | 'privacy'>('appearance');

  if (!isOpen) return null;

  const sections = [
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configurações</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tema da Aplicação</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Claro', icon: '☀️' },
                      { value: 'dark', label: 'Escuro', icon: '🌙' },
                      { value: 'system', label: 'Sistema', icon: '💻' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as any)}
                        className={`p-4 border-2 rounded-lg text-center transition-colors ${
                          theme === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-medium">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personalização</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Densidade da interface</div>
                        <div className="text-sm text-gray-500">Ajustar espaçamento entre elementos</div>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Compacta</option>
                        <option>Normal</option>
                        <option>Espaçosa</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Tamanho da fonte</div>
                        <div className="text-sm text-gray-500">Aumentar ou diminuir o texto</div>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Pequena</option>
                        <option>Normal</option>
                        <option>Grande</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notificações</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Ativar notificações</div>
                        <div className="text-sm text-gray-500">Receber alertas de novas mensagens</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications}
                          onChange={(e) => setNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Sons de notificação</div>
                        <div className="text-sm text-gray-500">Reproduzir som ao receber mensagens</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sounds}
                          onChange={(e) => setSounds(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Notificação</h3>
                  <div className="space-y-3">
                    {[
                      'Mensagens diretas',
                      'Menções em grupos',
                      'Novos grupos',
                      'Convites para grupos',
                      'Status de usuários'
                    ].map((type) => (
                      <div key={type} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Otimizações</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Animações</div>
                        <div className="text-sm text-gray-500">Reduzir animações para melhor performance</div>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Todas</option>
                        <option>Essenciais</option>
                        <option>Nenhuma</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Qualidade de imagem</div>
                        <div className="text-sm text-gray-500">Comprimir imagens para economizar dados</div>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg">
                        <option>Alta</option>
                        <option>Média</option>
                        <option>Baixa</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cache e Armazenamento</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar dados da aplicação
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar cache local
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Privacidade</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Status online</div>
                        <div className="text-sm text-gray-500">Mostrar quando você está online</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Última visualização</div>
                        <div className="text-sm text-gray-500">Compartilhar quando você viu mensagens pela última vez</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Seus dados são armazenados localmente e enviados apenas para o servidor da universidade.
                      Não compartilhamos informações com terceiros.
                    </p>
                    
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir todos os dados locais
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onClose}>
            Salvar Alterações
          </Button>
        </div>
      </Card>
    </div>
  );
}
