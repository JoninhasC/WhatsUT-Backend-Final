import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, Users } from 'lucide-react';
import socketService from '../services/socket';
import { userService, groupService } from '../services/api';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  name: string;
  type: 'user' | 'group';
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

function IntegratedChatPageSimple() {
  const { user, token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeWebSocket = async () => {
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      try {
        // Conectar ao WebSocket
        socketService.connect(token);
        
        // Verificar status da conexão periodicamente
        const checkConnection = () => {
          setIsConnected(socketService.getConnectionStatus());
        };
        const interval = setInterval(checkConnection, 1000);
        
        socketService.onNewMessage((message: any) => {
          console.log('📨 Nova mensagem recebida:', message);
          setMessages(prev => [...prev, {
            id: message.id || Date.now().toString(),
            content: message.content,
            senderId: message.senderId,
            senderName: message.senderName,
            timestamp: new Date()
          }]);
        });

        // Carregar chats
        await loadChats();
        
        // Cleanup interval
        return () => clearInterval(interval);
        
      } catch (error) {
        console.error('❌ Erro ao inicializar WebSocket:', error);
        toast.error('Erro ao conectar ao chat');
      }
    };

    initializeWebSocket();

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  const loadChats = async () => {
    try {
      // Carregar usuários
      const users = await userService.getUsers();
      const userChats = users
        .filter((u: any) => u.id !== user?.id)
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          type: 'user' as const
        }));

      // Carregar grupos
      const groups = await groupService.getGroups();
      const groupChats = groups.map((g: any) => ({
        id: g.id,
        name: g.name,
        type: 'group' as const
      }));

      setChats([...userChats, ...groupChats]);
    } catch (error) {
      console.error('❌ Erro ao carregar chats:', error);
      toast.error('Erro ao carregar conversas');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const message = {
      content: newMessage,
      targetId: selectedChat.id,
      chatType: (selectedChat.type === 'group' ? 'group' : 'private') as 'group' | 'private'
    };

    console.log('📤 Enviando mensagem via WebSocket:', message);
    socketService.sendMessage(message);
    setNewMessage('');
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setMessages([]); // Limpar mensagens anteriores
    
    // Entrar na sala do chat
    if (chat.type === 'group') {
      socketService.joinRoom(chat.id);
    } else {
      socketService.joinRoom(`private_${user?.id}_${chat.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Lista de Chats */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users size={20} />
            Conversas
            {isConnected ? (
              <span className="text-green-500 text-sm">(Online)</span>
            ) : (
              <span className="text-red-500 text-sm">(Offline)</span>
            )}
          </h2>
        </div>
        
        <div className="overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="font-medium">{chat.name}</div>
              <div className="text-sm text-gray-500">
                {chat.type === 'group' ? '👥 Grupo' : '👤 Usuário'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 bg-white border-b border-gray-200">
              <h3 className="text-lg font-semibold">{selectedChat.name}</h3>
              <p className="text-sm text-gray-500">
                {selectedChat.type === 'group' ? 'Grupo' : 'Chat privado'} - 
                Chat em tempo real via WebSocket
              </p>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.senderId !== user?.id && (
                      <p className="text-xs font-medium mb-1">{message.senderName}</p>
                    )}
                    <p>{message.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Nova Mensagem */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={16} />
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chat em Tempo Real
              </h3>
              <p className="text-gray-500">
                Selecione uma conversa para começar a usar o chat em tempo real via WebSocket
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntegratedChatPageSimple;
