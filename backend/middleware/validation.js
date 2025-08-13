const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }
    next();
};

// Validações para usuários
const validateUser = [
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
];

const validateUserUpdate = [
    body('username')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username deve ter entre 3 e 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username deve conter apenas letras, números e underscore'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('full_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome completo deve ter entre 2 e 100 caracteres'),
    body('role')
        .optional()
        .isIn(['admin', 'gerente', 'locutor'])
        .withMessage('Role deve ser admin, gerente ou locutor'),
    handleValidationErrors
];

// Validações para clientes
const validateClient = [
    body('company_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome da empresa deve ter entre 2 e 100 caracteres'),
    body('contact_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do contato deve ter entre 2 e 100 caracteres'),
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('phone')
        .optional()
        .isMobilePhone('pt-BR')
        .withMessage('Telefone inválido'),
    body('cnpj')
        .optional()
        .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
        .withMessage('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'),
    handleValidationErrors
];

// Validações para contratos
const validateContract = [
    body('client_id')
        .isInt({ min: 1 })
        .withMessage('ID do cliente deve ser um número inteiro positivo'),
    body('program_id')
        .isInt({ min: 1 })
        .withMessage('ID do programa deve ser um número inteiro positivo'),
    body('ad_type_id')
        .isInt({ min: 1 })
        .withMessage('ID do tipo de anúncio deve ser um número inteiro positivo'),
    body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('Título deve ter entre 5 e 200 caracteres'),
    body('start_date')
        .isISO8601()
        .withMessage('Data de início deve estar no formato YYYY-MM-DD'),
    body('end_date')
        .isISO8601()
        .withMessage('Data de fim deve estar no formato YYYY-MM-DD')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.start_date)) {
                throw new Error('Data de fim deve ser posterior à data de início');
            }
            return true;
        }),
    body('total_spots')
        .isInt({ min: 1 })
        .withMessage('Total de spots deve ser um número inteiro positivo'),
    body('price_per_spot')
        .isFloat({ min: 0 })
        .withMessage('Preço por spot deve ser um número positivo'),
    body('discount_percentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Percentual de desconto deve estar entre 0 e 100'),
    handleValidationErrors
];

// Validações para programas de rádio
const validateRadioProgram = [
    body('program_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do programa deve ter entre 2 e 100 caracteres'),
    body('start_time')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Hora de início deve estar no formato HH:MM'),
    body('end_time')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Hora de fim deve estar no formato HH:MM'),
    body('days_of_week')
        .isArray({ min: 1 })
        .withMessage('Dias da semana devem ser um array com pelo menos um item')
        .custom((value) => {
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const isValid = value.every(day => validDays.includes(day));
            if (!isValid) {
                throw new Error('Dias da semana inválidos');
            }
            return true;
        }),
    body('locutor_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID do locutor deve ser um número inteiro positivo'),
    handleValidationErrors
];

// Validações para login
const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username é obrigatório'),
    body('password')
        .notEmpty()
        .withMessage('Senha é obrigatória'),
    handleValidationErrors
];

// Validações para parâmetros de ID
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID deve ser um número inteiro positivo'),
    handleValidationErrors
];

module.exports = {
    validateUser,
    validateUserUpdate,
    validateClient,
    validateContract,
    validateRadioProgram,
    validateLogin,
    validateId,
    handleValidationErrors
};

