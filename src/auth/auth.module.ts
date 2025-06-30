// 📚 EXPLICAÇÃO DIDÁTICA: AUTH MODULE
// ================================
// 
// 🎯 O QUE É UM MÓDULO NO NESTJS?
// Um módulo é como um "departamento" de uma empresa:
// - Cada departamento tem suas responsabilidades específicas
// - Pode usar serviços de outros departamentos (imports)
// - Pode oferecer seus serviços para outros departamentos (exports)
// - Tem seus próprios funcionários (providers) e atendimento ao público (controllers)
//
// 🏢 ANALOGIA: Departamento de Segurança de um Shopping
// - É responsável por autenticar pessoas (login/logout)
// - Usa o departamento de RH (UsersModule) para verificar quem está cadastrado
// - Usa biblioteca externa (JWT) para criar crachás digitais
// - Oferece serviço de verificar quem está online para outros departamentos

import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { OnlineUsersService } from './online-users.service';

// 🏷️ @Module: Decorator que marca esta classe como um módulo NestJS
// É como uma etiqueta que diz "Esta é a configuração do departamento de autenticação"
@Module({
  
  // 📥 IMPORTS: Módulos que este módulo precisa usar
  // É como dizer "Nosso departamento precisa dos serviços destes outros departamentos"
  imports: [
    // 🔄 forwardRef: Resolve referência circular entre AuthModule e UsersModule
    // Analogia: Departamento de Segurança precisa do RH, e RH precisa da Segurança
    // forwardRef() evita que eles "disputem" quem é criado primeiro
    forwardRef(() => UsersModule),
    
    // 🛂 PassportModule: Biblioteca para estratégias de autenticação
    // É como ter diferentes tipos de portões de entrada (senha, biometria, cartão)
    PassportModule,
    
    // 🎫 JwtModule: Configuração dos tokens JWT (crachás digitais)
    JwtModule.register({
      // 🔐 secret: Chave secreta para assinar os tokens (como assinatura em documento)
      // Se não existir variável de ambiente JWT, usa 'senhasemenv' como padrão
      secret: process.env.JWT || 'senhasemenv',
      
      // ⏰ signOptions: Configurações do token
      // expiresIn: '1d' = token expira em 1 dia (como um passe de visitante)
      signOptions: { expiresIn: '1d' },
    }),
  ],
  
  // 🏭 PROVIDERS: Serviços (classes) que este módulo fornece
  // São como os "funcionários especializados" do departamento
  providers: [
    AuthService,        // 👨‍💼 Gerente de autenticação - lógica de login/logout
    JwtStrategy,        // 🔍 Verificador de tokens - valida crachás digitais
    OnlineUsersService, // 📊 Monitor de usuários online - quem está conectado
  ],
  
  // 🌐 CONTROLLERS: Pontos de entrada HTTP (como balcões de atendimento)
  // Define quais URLs (endpoints) este módulo vai responder
  controllers: [AuthController], // 🏪 Balcão de autenticação - recebe pedidos de login
  
  // 📤 EXPORTS: Serviços que este módulo disponibiliza para outros módulos
  // É como dizer "Estes serviços nossos podem ser usados por outros departamentos"
  exports: [OnlineUsersService], // Outros módulos podem verificar quem está online
})
export class AuthModule {
  // 📝 NOTA: Classe vazia porque toda configuração está no decorator @Module
  // É como um organograma do departamento - só mostra a estrutura, sem implementação
}
