const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateClient, validateId } = require('../middleware/validation');

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Rota para obter todos os clientes
router.get('/', clientController.getAllClients);

// Rota para obter cliente por ID
router.get('/:id', validateId, clientController.getClientById);

// Rota para obter estatísticas do cliente
router.get('/:id/stats', validateId, authorize('admin', 'gerente'), clientController.getClientStats);

// Rota para criar cliente (admin e gerente)
router.post('/', authorize('admin', 'gerente'), validateClient, clientController.createClient);

// Rota para atualizar cliente (admin e gerente)
router.put('/:id', validateId, authorize('admin', 'gerente'), validateClient, clientController.updateClient);

// Rota para deletar/desativar cliente (apenas admin)
router.delete('/:id', validateId, authorize('admin'), clientController.deleteClient);

module.exports = router;

