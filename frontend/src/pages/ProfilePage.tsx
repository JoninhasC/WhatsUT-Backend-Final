/*
 * ========================================================================================
 * PROFILE PAGE - PÁGINA DE PERFIL DO USUÁRIO
 * ========================================================================================
 * 
 * 🎯 CONCEITO: Profile Page (Página de Perfil)
 * Esta página permite ao usuário visualizar e editar suas informações pessoais.
 * É como uma "carteira de identidade digital" onde o usuário pode ver e alterar
 * seus dados básicos dentro da aplicação.
 * 
 * 👤 FUNCIONALIDADES PRINCIPAIS:
 * - Exibir informações do usuário logado
 * - Permitir edição do nome (modo inline editing)
 * - Mostrar dados como email, data de criação, tipo de usuário
 * - Interface responsiva e intuitiva
 * - Validação de usuário autenticado
 * 
 * 🎨 CARACTERÍSTICAS DA UI:
 * - Design clean com cards
 * - Avatar circular com inicial do nome
 * - Modo de edição inline (clica para editar)
 * - Botões de salvar/cancelar
 * - Estados de carregamento e erro
 * 
 * 🏗️ ANALOGIA: 
 * É como a página "Minha Conta" de qualquer site:
 * - Mostra suas informações pessoais
 * - Permite alterar dados editáveis
 * - Mantém dados importantes protegidos
 * - Interface familiar e intuitiva
 */

// ============================================================================
// IMPORTAÇÕES: HOOKS, CONTEXTOS E COMPONENTES
// ============================================================================

/*
 * 📚 IMPORTAÇÕES EXPLICADAS:
 * 
 * ⚛️ React Hooks:
 * - useState: Para gerenciar estado local (modo edição, valores editados)
 * 
 * 🔐 Contexts:
 * - useAuth: Para acessar dados do usuário autenticado
 * 
 * 🧩 Componentes UI:
 * - Card, CardHeader, CardContent: Componentes de layout reutilizáveis
 * 
 * 🎨 Ícones (Lucide React):
 * - User: Ícone de usuário
 * - Calendar: Ícone de data
 * - Shield: Ícone de segurança/admin
 * - Edit3: Ícone de edição
 * - Save: Ícone de salvar
 * - X: Ícone de cancelar
 */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui';
import { User, Calendar, Shield, Edit3, Save, X } from 'lucide-react';

// ============================================================================
// COMPONENTE PRINCIPAL: PROFILEPAGE
// ============================================================================

/*
 * 🏛️ FUNÇÃO PROFILEPAGE
 * 
 * Componente funcional que renderiza a página de perfil do usuário.
 * Gerencia estado local para edição inline e integra com contexto de autenticação.
 * 
 * 🔄 FLUXO PRINCIPAL:
 * 1. Verifica se usuário está autenticado
 * 2. Exibe informações do perfil
 * 3. Permite edição inline do nome
 * 4. Gerencia salvamento/cancelamento de edições
 */
function ProfilePage() {
  
  // ========================================================================
  // HOOKS E ESTADO LOCAL
  // ========================================================================
  
  /*
   * 🔐 HOOK DE AUTENTICAÇÃO
   * 
   * Extrai dados do usuário atual do contexto de autenticação.
   * O usuário contém: id, name, email, userType, createdAt, etc.
   */
  const { user } = useAuth();
  
  /*
   * ✏️ ESTADO DE EDIÇÃO
   * 
   * 🎯 isEditing: Controla se o usuário está no modo de edição
   * - false: Modo visualização (padrão)
   * - true: Modo edição (campos editáveis)
   * 
   * 💡 PADRÃO INLINE EDITING:
   * Permite editar diretamente na interface sem ir para página separada.
   * Mais intuitivo e rápido para pequenas edições.
   */
  const [isEditing, setIsEditing] = useState(false);
  
  /*
   * 📝 ESTADO DO NOME EDITADO
   * 
   * 🎯 editedName: Armazena valor temporário do nome durante edição
   * 
   * 🔄 FLUXO:
   * 1. Inicializa com nome atual do usuário
   * 2. Durante edição, armazena valor temporário
   * 3. Ao salvar, envida para API
   * 4. Ao cancelar, reverte para valor original
   * 
   * 💡 DEFENSIVE PROGRAMMING:
   * user?.name || '' garante que sempre temos uma string,
   * mesmo se user for null ou name for undefined.
   */
  const [editedName, setEditedName] = useState(user?.name || '');

  // ========================================================================
  // GUARDA DE AUTENTICAÇÃO
  // ========================================================================
  
  /*
   * 🛡️ VERIFICAÇÃO DE USUÁRIO AUTENTICADO
   * 
   * Se não há usuário logado, mostra uma mensagem amigável
   * ao invés de quebrar a aplicação.
   * 
   * 🎯 PADRÃO EARLY RETURN:
   * Retorna interface alternativa se condição não é atendida.
   * Evita aninhamento excessivo de condicionais.
   */
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

  // ========================================================================
  // HANDLERS DE AÇÕES
  // ========================================================================
  
  /*
   * 💾 HANDLER: SALVAR EDIÇÃO
   * 
   * Função executada quando usuário clica em "Salvar" após editar o nome.
   * 
   * 🔄 FLUXO ATUAL:
   * 1. Log do valor editado (desenvolvimento)
   * 2. Sai do modo de edição
   * 3. TODO: Enviar para API real
   * 
   * 🚧 IMPLEMENTAÇÃO FUTURA:
   * - Validação do nome (comprimento, caracteres permitidos)
   * - Chamada para API de atualização de perfil
   * - Tratamento de erros de rede
   * - Atualização do contexto de autenticação
   * - Feedback visual de sucesso/erro
   */
  const handleSaveEdit = () => {
    // 📝 Log para desenvolvimento
    console.log('Salvando perfil:', editedName);
    
    // 🔄 Sair do modo de edição
    setIsEditing(false);
    
    // 🚧 TODO: Implementar integração com API
    // try {
    //   await api.updateProfile({ name: editedName });
    //   updateUserInContext({ ...user, name: editedName });
    //   toast.success('Perfil atualizado com sucesso!');
    // } catch (error) {
    //   toast.error('Erro ao atualizar perfil');
    //   setEditedName(user.name); // Reverter em caso de erro
    // }
  };

  /*
   * ❌ HANDLER: CANCELAR EDIÇÃO
   * 
   * Função executada quando usuário clica em "Cancelar" durante edição.
   * 
   * 🔄 FLUXO:
   * 1. Reverte valor editado para valor original
   * 2. Sai do modo de edição
   * 
   * 💡 USER EXPERIENCE:
   * Permite ao usuário "desfazer" mudanças não salvas,
   * dando sensação de segurança ao experimentar edições.
   */
  const handleCancelEdit = () => {
    setEditedName(user.name);  // 🔄 Reverter para valor original
    setIsEditing(false);       // ❌ Sair do modo edição
  };

  // ========================================================================
  // RENDERIZAÇÃO DA INTERFACE
  // ========================================================================
  
  /*
   * 🎨 ESTRUTURA VISUAL DA PÁGINA
   * 
   * Layout responsivo com:
   * - Container centralizado com largura máxima
   * - Card principal com sombra
   * - Header com avatar e título
   * - Content com informações detalhadas
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg">
          
          {/* ============================================================
               HEADER: AVATAR E TÍTULO
               ============================================================ */}
          
          <CardHeader>
            <div className="text-center">
              
              {/* 👤 AVATAR CIRCULAR */}
              {/*
               * 🎨 AVATAR BASEADO NA INICIAL DO NOME
               * 
               * 🎯 CARACTERÍSTICAS:
               * - Círculo verde com inicial do nome
               * - Tamanho fixo (24x24 = 96px)
               * - Centralizado horizontalmente
               * - Primeira letra maiúscula
               * 
               * 💡 FALLBACK ELEGANTE:
               * Se não houver foto de perfil, usa inicial do nome.
               * Solução comum em aplicações modernas.
               */}
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {/* 📝 TÍTULO E DESCRIÇÃO */}
              <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
              <p className="text-gray-600">Gerencie suas informações pessoais</p>
            </div>
          </CardHeader>
          
          {/* ============================================================
               CONTENT: INFORMAÇÕES DETALHADAS
               ============================================================ */}
          
          <CardContent>
            
            {/* 📋 LISTA DE INFORMAÇÕES DO PERFIL */}
            {/*
             * 🎨 LAYOUT:
             * - Espaçamento vertical entre items
             * - Grid responsivo com ícones
             * - Separadores visuais
             */}
            <div className="space-y-6">
              
              {/* ========================================================
                   CAMPO: NOME (EDITÁVEL)
                   ======================================================== */}
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    
                    {/* 🔄 RENDERIZAÇÃO CONDICIONAL: MODO VISUALIZAÇÃO vs EDIÇÃO */}
                    {/*
                     * 💡 PADRÃO INLINE EDITING:
                     * - Modo visualização: Mostra nome + botão editar
                     * - Modo edição: Mostra input + botões salvar/cancelar
                     */}
                    {isEditing ? (
                      // 📝 MODO EDIÇÃO: INPUT + BOTÕES
                      <div className="flex items-center space-x-2">
                        {/*
                         * 📝 INPUT DE EDIÇÃO
                         * 
                         * 🎯 CARACTERÍSTICAS:
                         * - Valor controlado (editedName)
                         * - Estilo consistente com design system
                         * - Foco automático seria ideal (autoFocus)
                         * - Enter para salvar seria UX melhor
                         */}
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Digite seu nome"
                        />
                        
                        {/* 💾 BOTÃO SALVAR */}
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:text-green-700 transition-colors"
                          title="Salvar alterações"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        
                        {/* ❌ BOTÃO CANCELAR */}
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Cancelar edição"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      // 👁️ MODO VISUALIZAÇÃO: NOME + BOTÃO EDITAR
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        
                        {/* ✏️ BOTÃO EDITAR */}
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

              {/* ========================================================
                   CAMPO: EMAIL (SOMENTE LEITURA)
                   ======================================================== */}
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* ========================================================
                   CAMPO: TIPO DE USUÁRIO (SOMENTE LEITURA)
                   ======================================================== */}
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tipo de Usuário</p>
                  {/*
                   * 🎨 BADGE COLORIDO BASEADO NO TIPO
                   * 
                   * 💡 MAPEAMENTO VISUAL:
                   * - admin: Badge azul (autoridade)
                   * - user: Badge verde (padrão)
                   * - Outros: Badge cinza (neutro)
                   * 
                   * 🔧 CAPITALIZAÇÃO:
                   * Transforma primeira letra em maiúscula para melhor apresentação.
                   */}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.userType === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : user.userType === 'user'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                  </span>
                </div>
              </div>

              {/* ========================================================
                   CAMPO: DATA DE CRIAÇÃO (SOMENTE LEITURA)
                   ======================================================== */}
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Membro desde</p>
                  {/*
                   * 📅 FORMATAÇÃO DE DATA
                   * 
                   * 🎯 CONVERSÃO:
                   * - user.createdAt pode ser string ISO ou Date
                   * - new Date() garante conversão para Date object
                   * - toLocaleDateString() formata para padrão brasileiro
                   * 
                   * 💡 LOCALIZAÇÃO:
                   * 'pt-BR' garante formato DD/MM/AAAA familiar aos usuários brasileiros.
                   */}
                  <p className="font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* ============================================================
                 SEÇÃO: AÇÕES ADICIONAIS
                 ============================================================ */}
            
            {/*
             * 🚧 ÁREA PARA FUTURAS FUNCIONALIDADES
             * 
             * 💡 POSSÍVEIS ADIÇÕES:
             * - Alterar senha
             * - Upload de foto de perfil
             * - Configurações de privacidade
             * - Exportar dados pessoais
             * - Excluir conta
             */}
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

/*
 * ========================================================================================
 * 📚 RESUMO EDUCACIONAL - PROFILE PAGE
 * ========================================================================================
 * 
 * 🎯 O QUE APRENDEMOS:
 * 
 * 1. 🎨 INLINE EDITING PATTERN:
 *    - Edição direta na interface sem modais ou páginas separadas
 *    - Estados de visualização vs edição
 *    - Botões de salvar/cancelar contextuais
 *    - UX mais fluida e intuitiva
 * 
 * 2. 🛡️ DEFENSIVE PROGRAMMING:
 *    - Verificação de usuário autenticado
 *    - Fallbacks para dados opcionais (user?.name || '')
 *    - Early returns para condições especiais
 *    - Interface alternativa para estados de erro
 * 
 * 3. 📊 STATE MANAGEMENT LOCAL:
 *    - useState para modo de edição
 *    - Estado temporário para valores editados
 *    - Sincronização com props do contexto
 *    - Reversão de mudanças não salvas
 * 
 * 4. 🎭 RENDERIZAÇÃO CONDICIONAL:
 *    - Diferentes UIs baseadas no estado
 *    - Componentes que se transformam dinamicamente
 *    - Feedback visual imediato
 * 
 * 5. 🎨 DESIGN SYSTEM CONSISTENCY:
 *    - Reutilização de componentes UI (Card, Button)
 *    - Ícones consistentes (Lucide React)
 *    - Paleta de cores padronizada
 *    - Espaçamentos e tipografia consistentes
 * 
 * 💡 EXEMPLO PRÁTICO DE FLUXO:
 * 
 * VISUALIZAÇÃO INICIAL:
 * 1. 👤 Usuário acessa página de perfil
 * 2. 📊 Sistema verifica autenticação
 * 3. 🎨 Renderiza informações do perfil
 * 4. 👁️ Nome exibido com ícone de editar
 * 
 * PROCESSO DE EDIÇÃO:
 * 1. ✏️ Usuário clica em editar nome
 * 2. 🔄 Estado muda para isEditing=true
 * 3. 📝 Input aparece com valor atual
 * 4. 👤 Usuário digita novo nome
 * 5. 💾 Usuário clica salvar OU ❌ clica cancelar
 * 6. 🔄 Estado volta para visualização
 * 
 * 📈 MELHORIAS POSSÍVEIS:
 * 
 * 🚀 UX ENHANCEMENTS:
 * - AutoFocus no input ao entrar em edição
 * - Enter para salvar, Escape para cancelar
 * - Loading state durante salvamento
 * - Validação em tempo real
 * 
 * 🔧 FUNCIONALIDADES:
 * - Upload de avatar
 * - Alteração de senha
 * - Configurações de notificação
 * - Tema claro/escuro
 * - Exportação de dados
 * 
 * 🛡️ SEGURANÇA:
 * - Validação de campos no frontend
 * - Sanitização de inputs
 * - Rate limiting para updates
 * - Confirmação para ações destrutivas
 * 
 * 🔗 PRÓXIMOS PASSOS:
 * Agora que entendemos como fazer uma página de perfil completa, podemos aplicar
 * os mesmos padrões em outras páginas:
 * - Settings Page (configurações globais)
 * - Admin Page (painel administrativo)
 * - User Management (gerenciamento de usuários)
 * 
 * ========================================================================================
 */
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
