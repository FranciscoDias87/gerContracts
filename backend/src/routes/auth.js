const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, handleValidationErrors } = require('../middleware/validation');

// Rota de login
router.post('/login', validateLogin, authController.login);

// Rota de registro (apenas para admins)
router.post('/register', 
    authenticateToken,
    [
        body('username')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username deve ter entre 3 e 50 caracteres')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username deve conter apenas letras, números e underscore'),
        body('email')
            .isEmail()
            .withMessage('Email inválido')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Senha deve ter pelo menos 6 caracteres'),
        body('full_name')
            .isLength({ min: 2, max: 100 })
            .withMessage('Nome completo deve ter entre 2 e 100 caracteres'),
        body('role')
            .isIn(['admin', 'gerente', 'locutor'])
            .withMessage('Role deve ser admin, gerente ou locutor'),
        handleValidationErrors
    ],
    (req, res, next) => {
        // Apenas admins podem registrar novos usuários
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Apenas administradores podem registrar novos usuários'
            });
        }
        next();
    },
    authController.register
);

// Rota para obter perfil do usuário logado
router.get('/profile', authenticateToken, authController.getProfile);

// Rota para atualizar perfil do usuário logado
router.put('/profile', 
    authenticateToken,
    [
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Nome completo deve ter entre 2 e 100 caracteres'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email inválido')
            .normalizeEmail(),
        handleValidationErrors
    ],
    authController.updateProfile
);

// Rota para alterar senha
router.put('/change-password',
    authenticateToken,
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Senha atual é obrigatória'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Nova senha deve ter pelo menos 6 caracteres'),
        handleValidationErrors
    ],
    authController.changePassword
);

module.exports = router;

