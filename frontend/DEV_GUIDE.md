# 🚀 WhatsUT Development Environment

## 🔧 Development Commands

### Quick Start
```bash
# Limpar e reiniciar tudo
npm run clean:start

# Desenvolvimento com hot reload
npm run dev:full

# Build e preview
npm run build:preview
```

### Development Scripts
```bash
# Frontend apenas
npm run dev:frontend

# Backend apenas  
npm run dev:backend

# Verificar saúde da aplicação
npm run health:check

# Reset completo
npm run reset:all
```

## 🐛 Troubleshooting

### Porta em uso
```bash
npm run port:kill
npm run dev
```

### Cache issues
```bash
npm run clean:cache
npm run dev
```

### Dependências
```bash
npm run deps:check
npm run deps:update
```

## 📊 Monitoring

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api
- Health: http://localhost:3000/health
