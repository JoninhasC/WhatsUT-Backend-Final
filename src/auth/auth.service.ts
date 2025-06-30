/**
 * 🔐 SERVIÇO DE AUTENTICAÇÃO - AUTH.SERVICE.TS
 * 
 * ANALOGIA: Imagine este arquivo como o "porteiro de um prédio" do WhatsUT.
 * Ele é responsável por verificar se as pessoas podem entrar (login), 
 * registrar novos moradores (cadastro) e controlar quem está dentro (logout).
 * 
 * FUNÇÃO NO PROJETO: Este arquivo contém toda a lógica de segurança do sistema.
 * Ele verifica senhas, gera "cartões de acesso" (tokens JWT) e gerencia quem está online.
 */

// 📦 IMPORTAÇÕES - Como pedir emprestado ferramentas de outros lugares
import { Injectable, UnauthorizedException } from '@nestjs/common';
// Injectable: Marca esta classe como um "serviço" que pode ser usado em outros lugares
// UnauthorizedException: Um tipo especial de erro para quando alguém não tem permissão

import { UsersService } from '../users/users.service';
// Importa o serviço que gerencia usuários (buscar, criar, etc.)
// É como chamar o "departamento de usuários" para ajudar

import { JwtService } from '@nestjs/jwt';
// Importa o serviço que cria e verifica tokens JWT
// JWT é como um "cartão de acesso temporário" que prova que você fez login

import * as bcrypt from 'bcrypt';
// Bcrypt é uma biblioteca para criptografar senhas
// É como um "cofre super seguro" que transforma senhas em códigos impossíveis de decifrar

import { CreateUserDto } from '../users/dto/create-user.dto';
// DTO = Data Transfer Object (Objeto de Transferência de Dados)
// É como um "formulário padronizado" que define como os dados de um novo usuário devem chegar

import { OnlineUsersService } from './online-users.service';
// Serviço que controla quais usuários estão online no momento
// É como uma "lista de presença" em tempo real

// 🏷️ DECORADOR @Injectable - Marca esta classe como um "serviço"
// Isso permite que o NestJS gerencie automaticamente esta classe e a use em outros lugares
@Injectable()
export class AuthService {
  
  /**
   * 🏗️ CONSTRUTOR - Como montar o "porteiro" com todas as ferramentas necessárias
   * 
   * ANALOGIA: Imagine que você está contratando um porteiro para um prédio.
   * Você precisa dar a ele: a lista de moradores, a máquina de fazer cartões de acesso,
   * e um quadro para marcar quem está dentro do prédio.
   */
  constructor(
    // private = só esta classe pode usar esta ferramenta
    // usersService = a ferramenta para gerenciar usuários (buscar, criar, etc.)
    private usersService: UsersService,
    
    // jwtService = a ferramenta para criar "cartões de acesso" (tokens)
    private jwtService: JwtService,
    
    // onlineUsers = a ferramenta para controlar quem está online
    private onlineUsers: OnlineUsersService,
  ) {}
  // O constructor está vazio porque só estamos declarando as ferramentas, não fazendo nada ainda

  /**
   * 📝 MÉTODO REGISTER - Cadastrar um novo usuário
   * 
   * ANALOGIA: É como um formulário de "cadastro de novo morador".
   * Você preenche seus dados e o porteiro os envia para o departamento de usuários processar.
   */
  async register(createUser: CreateUserDto) {
    // async = esta função pode demorar um pouco (acessa banco de dados)
    // createUser = os dados do novo usuário que chegaram do formulário
    // CreateUserDto = o "formato padronizado" dos dados (nome, senha, etc.)
    
    // Simplesmente repassa os dados para o serviço de usuários criar a conta
    // É como o porteiro entregar o formulário para o departamento responsável
    return this.usersService.create(createUser);
  }

  /**
   * 🔓 MÉTODO SIGNIN - Fazer login (entrar no sistema)
   * 
   * ANALOGIA: É como chegar na portaria e mostrar seus documentos.
   * O porteiro verifica se você é realmente quem diz ser e, se for,
   * te dá um cartão de acesso temporário para circular pelo prédio.
   */
  async signIn(username: string, pass: string) {
    // async = pode demorar (precisa consultar base de dados)
    // username = nome do usuário (como o nome na campainha)
    // pass = senha (como a chave do apartamento)
    
    // 1️⃣ BUSCAR O USUÁRIO - Procurar na lista de moradores
    const user = await this.usersService.findOne(username);
    // await = espera a busca terminar antes de continuar
    // É como o porteiro consultar a lista de moradores para ver se você está cadastrado
    
    // 2️⃣ VERIFICAR CREDENCIAIS - Conferir se a senha está correta
    // if (user?.password !== pass) { // LINHA COMENTADA - versão antiga (insegura)
    
    // Verificação em duas partes:
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      // !user = se não encontrou o usuário na lista
      // || = OU (operador lógico)
      // !(await bcrypt.compare(...)) = se a senha não confere
      
      // bcrypt.compare = compara a senha digitada com a senha criptografada salva
      // É como usar uma "máquina especial" que consegue verificar se duas senhas são iguais
      // sem revelar qual é a senha real (por segurança)
      
      // Se chegou aqui, ou o usuário não existe OU a senha está errada
      throw new UnauthorizedException('Credenciais inválidas');
      // throw = lança um erro (como acionar um alarme)
      // UnauthorizedException = tipo de erro específico para "acesso negado"
    }

    // 3️⃣ MARCAR COMO ONLINE - Anotar que a pessoa entrou no prédio
    this.onlineUsers.addUser(user.id);
    // É como marcar na lista de presença que esta pessoa está dentro do prédio agora

    // 4️⃣ CRIAR O TOKEN (CARTÃO DE ACESSO) - Preparar os dados para o cartão
    const payload = { name: user.name, sub: user.id };
    // payload = as informações que vão dentro do "cartão de acesso"
    // name = nome da pessoa (para identificação)
    // sub = "subject" (o ID único da pessoa no sistema)
    
    // 5️⃣ RETORNAR O RESULTADO - Entregar o cartão de acesso e os dados da pessoa
    return { 
      // O que esta função vai devolver para quem a chamou:
      
      access_token: this.jwtService.sign(payload),
      // access_token = o "cartão de acesso" digital
      // this.jwtService.sign(payload) = criar o cartão com as informações da pessoa
      // É como usar uma máquina especial que imprime cartões de acesso seguros
      
      user: {
        // Dados básicos da pessoa que fez login (para mostrar na tela)
        id: user.id,           // Número de identificação único
        name: user.name,       // Nome da pessoa
        isOnline: true         // Marcando que está online agora
      }
    };
    // Esta função retorna tanto o "cartão de acesso" quanto os dados da pessoa
    // Assim, o frontend recebe tudo de uma vez e não precisa fazer outra consulta
  }

  /**
   * 🚪 MÉTODO SIGNOUT - Fazer logout (sair do sistema)
   * 
   * ANALOGIA: É como devolver o cartão de acesso na portaria ao sair do prédio.
   * O porteiro anota que você saiu e remove seu nome da lista de pessoas presentes.
   */
  async singOut(id: string) {
    // async = pode demorar um pouco
    // id = o número de identificação da pessoa que quer sair
    
    // Remove a pessoa da lista de "quem está online"
    this.onlineUsers.removeUser(id);
    // É como riscar o nome da pessoa da lista de presença
    
    // Retorna uma mensagem de confirmação
    return 'Sucesso';
    // Simples confirmação de que o logout foi realizado
  }
}

/**
 * 📋 RESUMO DO PAPEL DESTE ARQUIVO NO SISTEMA:
 * 
 * O AuthService é o "CORAÇÃO DA SEGURANÇA" do WhatsUT. Ele:
 * 
 * 1. 🔐 CONTROLA ACESSO: Decide quem pode entrar no sistema
 * 2. 🎫 GERA TOKENS: Cria "cartões de acesso" digitais para usuários autenticados
 * 3. 👥 GERENCIA CADASTROS: Processa novos usuários
 * 4. 📊 MONITORA PRESENÇA: Controla quem está online
 * 5. 🛡️ PROTEGE SENHAS: Usa criptografia para manter senhas seguras
 * 
 * RELAÇÃO COM OUTROS ARQUIVOS:
 * - É USADO por: auth.controller.ts (que recebe as requisições HTTP)
 * - USA: users.service.ts (para gerenciar usuários)
 * - USA: JWT Service (para tokens)
 * - USA: OnlineUsers Service (para controle de presença)
 * 
 * SEM ESTE ARQUIVO: Qualquer pessoa poderia acessar o sistema sem fazer login!
 */
