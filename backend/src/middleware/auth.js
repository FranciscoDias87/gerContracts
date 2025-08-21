const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acesso requerido' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar se o usuário ainda existe e está ativo
        const user = await query(
            'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
        );

        if (user.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não encontrado ou inativo' 
            });
        }

        req.user = user[0];
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(403).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acesso negado. Permissões insuficientes.' 
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorize
};

