const { query } = require('../config/database');

const getAllClients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = 'WHERE is_active = TRUE';
        let params = [];

        if (search) {
            whereClause += ' AND (company_name LIKE ? OR contact_name LIKE ? OR email LIKE ? OR cnpj LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Buscar clientes com paginação
        const clients = await query(
            `SELECT id, company_name, contact_name, email, phone, address, cnpj, created_at, updated_at 
             FROM clients ${whereClause} 
             ORDER BY company_name ASC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Contar total de clientes
        const totalResult = await query(
            `SELECT COUNT(*) as total FROM clients ${whereClause}`,
            params
        );
        const total = totalResult[0].total;

        res.json({
            success: true,
            data: {
                clients,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

const getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const clients = await query(
            'SELECT * FROM clients WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (clients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Buscar contratos do cliente
        const contracts = await query(
            `SELECT c.id, c.contract_number, c.title, c.start_date, c.end_date, 
                    c.total_value, c.status, c.payment_status,
                    rp.program_name, at.type_name
             FROM contracts c
             JOIN radio_programs rp ON c.program_id = rp.id
             JOIN ad_types at ON c.ad_type_id = at.id
             WHERE c.client_id = ?
             ORDER BY c.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                client: clients[0],
                contracts
            }
        });

    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

const createClient = async (req, res) => {
    try {
        const { company_name, contact_name, email, phone, address, cnpj } = req.body;

        // Verificar se cliente já existe (por email ou CNPJ)
        let existingClients = [];
        if (cnpj) {
            existingClients = await query(
                'SELECT id FROM clients WHERE email = ? OR cnpj = ?',
                [email, cnpj]
            );
        } else {
            existingClients = await query(
                'SELECT id FROM clients WHERE email = ?',
                [email]
            );
        }

        if (existingClients.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cliente com este email ou CNPJ já existe'
            });
        }

        // Inserir cliente
        const result = await query(
            'INSERT INTO clients (company_name, contact_name, email, phone, address, cnpj) VALUES (?, ?, ?, ?, ?, ?)',
            [company_name, contact_name, email, phone, address, cnpj]
        );

        // Buscar cliente criado
        const newClient = await query(
            'SELECT * FROM clients WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Cliente criado com sucesso',
            data: {
                client: newClient[0]
            }
        });

    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { company_name, contact_name, email, phone, address, cnpj } = req.body;

        // Verificar se cliente existe
        const existingClients = await query('SELECT id FROM clients WHERE id = ? AND is_active = TRUE', [id]);
        if (existingClients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar se email ou CNPJ já existem para outro cliente
        let duplicateClients = [];
        if (cnpj) {
            duplicateClients = await query(
                'SELECT id FROM clients WHERE (email = ? OR cnpj = ?) AND id != ? AND is_active = TRUE',
                [email, cnpj, id]
            );
        } else if (email) {
            duplicateClients = await query(
                'SELECT id FROM clients WHERE email = ? AND id != ? AND is_active = TRUE',
                [email, id]
            );
        }

        if (duplicateClients.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email ou CNPJ já existe para outro cliente'
            });
        }

        // Atualizar cliente
        await query(
            `UPDATE clients SET 
             company_name = COALESCE(?, company_name),
             contact_name = COALESCE(?, contact_name),
             email = COALESCE(?, email),
             phone = COALESCE(?, phone),
             address = COALESCE(?, address),
             cnpj = COALESCE(?, cnpj)
             WHERE id = ?`,
            [company_name, contact_name, email, phone, address, cnpj, id]
        );

        // Buscar cliente atualizado
        const updatedClient = await query(
            'SELECT * FROM clients WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            data: {
                client: updatedClient[0]
            }
        });

    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se cliente existe
        const existingClients = await query('SELECT id FROM clients WHERE id = ? AND is_active = TRUE', [id]);
        if (existingClients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar se cliente tem contratos ativos
        const activeContracts = await query(
            'SELECT id FROM contracts WHERE client_id = ? AND status IN (?, ?)',
            [id, 'active', 'draft']
        );

        if (activeContracts.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar cliente com contratos ativos ou em rascunho'
            });
        }

        // Soft delete - marcar como inativo
        await query('UPDATE clients SET is_active = FALSE WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Cliente desativado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

const getClientStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se cliente existe
        const existingClients = await query('SELECT id FROM clients WHERE id = ? AND is_active = TRUE', [id]);
        if (existingClients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Estatísticas do cliente
        const stats = await query(
            `SELECT 
                COUNT(*) as total_contracts,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_contracts,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_contracts,
                SUM(total_value) as total_value,
                SUM(CASE WHEN payment_status = 'paid' THEN final_value ELSE 0 END) as paid_value,
                SUM(CASE WHEN payment_status = 'pending' THEN final_value ELSE 0 END) as pending_value
             FROM contracts 
             WHERE client_id = ?`,
            [id]
        );

        // Contratos por mês (últimos 12 meses)
        const monthlyContracts = await query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as contracts_count,
                SUM(final_value) as total_value
             FROM contracts 
             WHERE client_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month`,
            [id]
        );

        res.json({
            success: true,
            data: {
                stats: stats[0],
                monthlyContracts
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas do cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getClientStats
};

