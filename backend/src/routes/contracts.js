const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateContract, validateId } = require('../middleware/validation');

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Rota para obter todos os contratos
router.get('/', contractController.getAllContracts);

// Rota para obter estatísticas de contratos
router.get('/stats', contractController.getContractStats);

// Rota para obter contrato por ID
router.get('/:id', validateId, contractController.getContractById);

// Rota para criar contrato (admin e gerente)
router.post('/', authorize('admin', 'gerente'), validateContract, contractController.createContract);

// Rota para atualizar contrato (admin e gerente)
router.put('/:id', validateId, authorize('admin', 'gerente'), contractController.updateContract);

// Rota para aprovar contrato (admin e gerente)
router.put('/:id/approve', validateId, authorize('admin', 'gerente'), contractController.approveContract);

// Rota para deletar contrato (apenas admin)
router.delete('/:id', validateId, authorize('admin'), contractController.deleteContract);

module.exports = router;

