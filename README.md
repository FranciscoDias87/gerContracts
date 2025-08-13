gerContracts
Sistema para gerenciamento de contratos de publicidade em emissoras de rádio, com backend em Node.js/Express e frontend em React.

📋 Sumário
Sobre

Tecnologias

Pré-requisitos

Configuração e instalação

Variáveis de ambiente

Como rodar o projeto

API

Funcionalidades

Contribuição

Licença

Sobre
Sistema para facilitar o cadastro, gerenciamento e controle de contratos de anunciantes em rádios. Permite controle de usuários, clientes, contratos, autenticação segura com JWT e interface moderna em React.

Tecnologias
Backend: Node.js, Express, MySQL, JWT, bcrypt, express-validator

Frontend: React, React Router, Axios

Banco de dados: MySQL

Outros: dotenv para variáveis de ambiente, cors para políticas de acesso

Pré-requisitos
Node.js (versão >= 18)

MySQL (ou MariaDB) instalado e configurado

Yarn ou npm

Editor de código (VSCode recomendado)

Configuração e instalação
Clone o repositório:

bash
Copiar
Editar
git clone https://github.com/FranciscoDias87/gerContracts.git
cd gerContracts
Backend:

bash
Copiar
Editar
cd backend
npm install
Frontend:

bash
Copiar
Editar
cd ../frontend
npm install
Variáveis de ambiente
No diretório backend, crie um arquivo .env com as seguintes variáveis (exemplo):

ini
Copiar
Editar
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=radio_contracts_db
DB_PORT=3306

JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=24h

BCRYPT_ROUNDS=10

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
No diretório frontend, configure também o .env para apontar para o backend:

bash
Copiar
Editar
VITE_API_URL=http://localhost:3001/api
Como rodar o projeto
Backend
No terminal, dentro da pasta backend:

bash
Copiar
Editar
npm run dev
O servidor vai rodar na porta 3001 (http://localhost:3001).

Frontend
No terminal, dentro da pasta frontend:

bash
Copiar
Editar
npm run dev
O frontend será servido no http://localhost:5173 (padrão do Vite).

API
A API está organizada em rotas como:

/api/auth - autenticação e registro

/api/users - gerenciamento de usuários

/api/clients - gerenciamento de clientes/anunciantes

/api/contracts - gerenciamento de contratos de anúncios

Exemplo de login:

css
Copiar
Editar
POST /api/auth/login
Body:
{
  "username": "admin",
  "password": "senha123"
}
Resposta:

json
Copiar
Editar
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Administrador",
      "role": "admin",
      "is_active": true
    },
    "token": "token_jwt_gerado"
  }
}
Funcionalidades
Cadastro e login seguro com JWT

Controle de usuários com permissões por função (admin, gerente, locutor)

Cadastro e gerenciamento de clientes (anunciantes)

Cadastro e gerenciamento de contratos de publicidade

Validações robustas para dados enviados

Middleware para autenticação e autorização nas rotas protegidas

Dashboard para visualização e gerenciamento

Contribuição
Contribuições são bem-vindas! Para contribuir:

Fork este repositório

Crie uma branch com sua feature (git checkout -b feature/nome-da-feature)

Faça commit das suas mudanças (git commit -m 'feat: descrição da feature')

Faça push para a branch (git push origin feature/nome-da-feature)

Abra um Pull Request neste repositório

Licença
Projeto open-source desenvolvido por Francisco Dias sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

