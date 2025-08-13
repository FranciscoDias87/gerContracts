# 📜 GerContracts

**GerContracts** é um sistema de gerenciamento de contratos de publicidade para emissoras de rádio.  
Ele foi desenvolvido para facilitar o controle de anunciantes, contratos, pagamentos e relatórios,  
com um painel administrativo moderno e funcionalidades completas.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** React.js + Material UI
- **Backend:** Node.js + Express
- **Banco de Dados:** MySQL
- **Segurança:** Autenticação com JWT e controle de acesso por perfil
- **Empacotamento Desktop:** Electron
- **Integração de Pagamentos:** PIX e boletos
- **Relatórios e Contratos:** Impressão e assinatura eletrônica via Gov.br

---

## 📂 Estrutura do Projeto

```
/gerContracts
│── backend/               # API e lógica do servidor
│   ├── controllers/        # Controladores das rotas
│   ├── models/             # Modelos e conexão com banco
│   ├── routes/             # Rotas da API
│   ├── config/             # Configurações (banco, autenticação, etc.)
│   └── server.js           # Arquivo inicial do backend
│
│── frontend/               # Interface gráfica React + Material UI
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas do sistema
│   │   ├── services/       # Comunicação com API
│   │   └── App.js          # Estrutura principal
│
│── electron/               # Configuração do app desktop
│
└── README.md               # Documentação do projeto
```

---

## ⚙️ Funcionalidades

✅ Cadastro e controle de **anunciantes**  
✅ Cadastro e gerenciamento de **contratos**  
✅ Controle de **veiculação de anúncios**  
✅ Painel de **pagamentos** com busca por cliente  
✅ Controle **financeiro** completo  
✅ **Relatórios** e **impressão** de contratos  
✅ **Assinatura eletrônica** integrada ao Gov.br  
✅ **Controle de usuários** e níveis de acesso (Admin, Gerente, Locutor)  
✅ **Dashboard** inicial para todos os perfis  
✅ Aplicativo **desktop** com Electron

---

## 🔑 Perfis de Acesso

- **Administrador:** Controle total do sistema
- **Gerente:** Controle de contratos, pagamentos e relatórios
- **Locutor:** Acesso às informações de anúncios e contratos vinculados

---

## 📦 Instalação e Uso

### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/FranciscoDias87/gerContracts.git
```

### 2️⃣ Instalar dependências
```bash
cd gerContracts/backend
npm install

cd ../frontend
npm install
```

### 3️⃣ Configurar variáveis de ambiente
Crie um arquivo `.env` no diretório **backend** com:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=senha
DB_NAME=gercontracts
JWT_SECRET=sua_chave_secreta
PORT=5000
```

### 4️⃣ Rodar o backend
```bash
cd backend
npm start
```

### 5️⃣ Rodar o frontend
```bash
cd frontend
npm start
```

### 6️⃣ Empacotar como aplicativo desktop
```bash
npm run electron:build
```

---

## 🖥️ Tela Inicial (Dashboard)

📊 Painel com estatísticas rápidas sobre contratos ativos, pagamentos pendentes e anúncios em veiculação.

---

## 📜 Licença

Este projeto está licenciado sob a licença **MIT** - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

✍️ **Autor:** Francisco das Chagas Pereira Dias
