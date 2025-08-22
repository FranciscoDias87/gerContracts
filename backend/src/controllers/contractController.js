const { query, transaction } = require("../config/database");

const generateContractNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `CT${year}`;

  // Buscar o último número do ano
  const lastContract = await query(
    "SELECT contract_number FROM contracts WHERE contract_number LIKE ? ORDER BY contract_number DESC LIMIT 1",
    [`${prefix}%`]
  );

  let nextNumber = 1;
  if (lastContract.length > 0) {
    const lastNumber = parseInt(
      lastContract[0].contract_number.replace(prefix, "")
    );
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
};

const getAllContracts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const payment_status = req.query.payment_status || "";

    let whereClause = "WHERE 1=1";
    let params = [];

    if (search) {
      whereClause +=
        " AND (c.contract_number LIKE ? OR c.title LIKE ? OR cl.company_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += " AND c.status = ?";
      params.push(status);
    }

    if (payment_status) {
      whereClause += " AND c.payment_status = ?";
      params.push(payment_status);
    }

    // Filtrar por role do usuário
    if (req.user.role === "locutor") {
      whereClause += " AND rp.locutor_id = ?";
      params.push(req.user.id);
    }

    // Buscar contratos com informações relacionadas
    const contracts = await query(
      `SELECT c.*, cl.company_name, cl.contact_name, 
                    rp.program_name, at.type_name, at.duration_seconds,
                    u.full_name as created_by_name
             FROM contracts c
             JOIN clients cl ON c.client_id = cl.id
             JOIN radio_programs rp ON c.program_id = rp.id
             JOIN ad_types at ON c.ad_type_id = at.id
             JOIN users u ON c.created_by = u.id
             ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Contar total de contratos
    const totalResult = await query(
      `SELECT COUNT(*) as total 
             FROM contracts c
             JOIN clients cl ON c.client_id = cl.id
             JOIN radio_programs rp ON c.program_id = rp.id
             JOIN ad_types at ON c.ad_type_id = at.id
             JOIN users u ON c.created_by = u.id
             ${whereClause}`,
      params
    );
    const total = totalResult[0].total;

    res.json({
      success: true,
      data: {
        contracts,
        pagination: {
          page,
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const getContractById = async (req, res) => {
  try {
    const { id } = req.params;

    const contracts = await query(
      `SELECT c.*, cl.company_name, cl.contact_name, cl.email, cl.phone,
                    rp.program_name, rp.start_time, rp.end_time, rp.days_of_week,
                    at.type_name, at.duration_seconds,
                    u1.full_name as created_by_name,
                    u2.full_name as approved_by_name,
                    u3.full_name as locutor_name
             FROM contracts c
             JOIN clients cl ON c.client_id = cl.id
             JOIN radio_programs rp ON c.program_id = rp.id
             JOIN ad_types at ON c.ad_type_id = at.id
             JOIN users u1 ON c.created_by = u1.id
             LEFT JOIN users u2 ON c.approved_by = u2.id
             LEFT JOIN users u3 ON rp.locutor_id = u3.id
             WHERE c.id = ?`,
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contrato não encontrado",
      });
    }

    // Verificar permissão para locutor
    if (req.user.role === "locutor") {
      const contract = contracts[0];
      const program = await query(
        "SELECT locutor_id FROM radio_programs WHERE id = ?",
        [contract.program_id]
      );

      if (program[0].locutor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message:
            "Acesso negado. Você só pode visualizar contratos dos seus programas.",
        });
      }
    }

    // Buscar agendamentos de spots
    const spots = await query(
      "SELECT * FROM spot_schedule WHERE contract_id = ? ORDER BY scheduled_date, scheduled_time",
      [id]
    );

    // Buscar pagamentos
    const payments = await query(
      `SELECT p.*, u.full_name as created_by_name 
             FROM payments p
             JOIN users u ON p.created_by = u.id
             WHERE p.contract_id = ? 
             ORDER BY p.payment_date DESC`,
      [id]
    );

    // Buscar arquivos
    const files = await query(
      `SELECT cf.*, u.full_name as uploaded_by_name 
             FROM contract_files cf
             JOIN users u ON cf.uploaded_by = u.id
             WHERE cf.contract_id = ? 
             ORDER BY cf.uploaded_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        contract: contracts[0],
        spots,
        payments,
        files,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar contrato:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const createContract = async (req, res) => {
  try {
    const {
      client_id,
      program_id,
      ad_type_id,
      title,
      description,
      start_date,
      end_date,
      total_spots,
      price_per_spot,
      discount_percentage = 0,
    } = req.body;

    // Calcular valores
    const total_value = total_spots * price_per_spot;
    const discount_amount = (total_value * discount_percentage) / 100;
    const final_value = total_value - discount_amount;

    // Gerar número do contrato
    const contract_number = await generateContractNumber();

    const result = await transaction(async (connection) => {
      // Inserir contrato
      const [contractResult] = await connection.execute(
        `INSERT INTO contracts 
                 (contract_number, client_id, program_id, ad_type_id, title, description,
                  start_date, end_date, total_spots, price_per_spot, total_value,
                  discount_percentage, final_value, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contract_number,
          client_id,
          program_id,
          ad_type_id,
          title,
          description,
          start_date,
          end_date,
          total_spots,
          price_per_spot,
          total_value,
          discount_percentage,
          final_value,
          req.user.id,
        ]
      );

      return contractResult.insertId;
    });

    // Buscar contrato criado
    const newContract = await query(
      `SELECT c.*, cl.company_name, rp.program_name, at.type_name
             FROM contracts c
             JOIN clients cl ON c.client_id = cl.id
             JOIN radio_programs rp ON c.program_id = rp.id
             JOIN ad_types at ON c.ad_type_id = at.id
             WHERE c.id = ?`,
      [result]
    );

    res.status(201).json({
      success: true,
      message: "Contrato criado com sucesso",
      data: {
        contract: newContract[0],
      },
    });
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      program_id,
      ad_type_id,
      title,
      description,
      start_date,
      end_date,
      total_spots,
      price_per_spot,
      discount_percentage,
      status,
    } = req.body;

    // Verificar se contrato existe
    const existingContracts = await query(
      "SELECT * FROM contracts WHERE id = ?",
      [id]
    );
    if (existingContracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contrato não encontrado",
      });
    }

    const existingContract = existingContracts[0];

    // Verificar permissões
    if (req.user.role === "locutor") {
      return res.status(403).json({
        success: false,
        message: "Locutores não podem editar contratos",
      });
    }

    // Calcular novos valores se necessário
    let updateData = {
      client_id,
      program_id,
      ad_type_id,
      title,
      description,
      start_date,
      end_date,
      total_spots,
      price_per_spot,
      discount_percentage,
      status,
    };

    if (total_spots && price_per_spot) {
      const total_value = total_spots * price_per_spot;
      const discount_amount = (total_value * (discount_percentage || 0)) / 100;
      updateData.total_value = total_value;
      updateData.final_value = total_value - discount_amount;
    }

    // Remover campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Construir query de update dinamicamente
    const fields = Object.keys(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = Object.values(updateData);

    await query(`UPDATE contracts SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);

    // Buscar contrato atualizado
    const updatedContract = await query(
      `SELECT c.*, cl.company_name, rp.program_name, at.type_name
             FROM contracts c
             JOIN clients cl ON c.client_id = cl.id
             JOIN radio_programs rp ON c.program_id = rp.id
             JOIN ad_types at ON c.ad_type_id = at.id
             WHERE c.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Contrato atualizado com sucesso",
      data: {
        contract: updatedContract[0],
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se contrato existe
    const existingContracts = await query(
      "SELECT status FROM contracts WHERE id = ?",
      [id]
    );
    if (existingContracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contrato não encontrado",
      });
    }

    // Verificar permissões
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Apenas administradores podem deletar contratos",
      });
    }

    const contract = existingContracts[0];

    // Verificar se contrato pode ser deletado
    if (contract.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Não é possível deletar contratos ativos",
      });
    }

    // Deletar contrato e dados relacionados
    await transaction(async (connection) => {
      await connection.execute(
        "DELETE FROM spot_schedule WHERE contract_id = ?",
        [id]
      );
      await connection.execute("DELETE FROM payments WHERE contract_id = ?", [
        id,
      ]);
      await connection.execute(
        "DELETE FROM contract_files WHERE contract_id = ?",
        [id]
      );
      await connection.execute("DELETE FROM contracts WHERE id = ?", [id]);
    });

    res.json({
      success: true,
      message: "Contrato deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar contrato:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const approveContract = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissões
    if (req.user.role === "locutor") {
      return res.status(403).json({
        success: false,
        message: "Locutores não podem aprovar contratos",
      });
    }

    // Verificar se contrato existe e está em draft
    const existingContracts = await query(
      "SELECT status FROM contracts WHERE id = ?",
      [id]
    );
    if (existingContracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contrato não encontrado",
      });
    }

    if (existingContracts[0].status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Apenas contratos em rascunho podem ser aprovados",
      });
    }

    // Aprovar contrato
    await query(
      "UPDATE contracts SET status = ?, approved_by = ? WHERE id = ?",
      ["active", req.user.id, id]
    );

    res.json({
      success: true,
      message: "Contrato aprovado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao aprovar contrato:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const getContractStats = async (req, res) => {
  try {
    let whereClause = "";
    let params = [];

    // Filtrar por role do usuário
    if (req.user.role === "locutor") {
      whereClause =
        "JOIN radio_programs rp ON c.program_id = rp.id WHERE rp.locutor_id = ?";
      params.push(req.user.id);
    }

    // Estatísticas gerais
    const stats = await query(
      `SELECT 
                COUNT(*) as total_contracts,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_contracts,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_contracts,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_contracts,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_contracts,
                SUM(total_value) as total_value,
                SUM(final_value) as final_value,
                SUM(CASE WHEN payment_status = 'paid' THEN final_value ELSE 0 END) as paid_value,
                SUM(CASE WHEN payment_status = 'pending' THEN final_value ELSE 0 END) as pending_value
             FROM contracts c ${whereClause}`,
      params
    );

    // Contratos por mês (últimos 12 meses)
    const monthlyContracts = await query(
      `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as contracts_count,
                SUM(final_value) as total_value
             FROM contracts c ${whereClause}
             ${
               whereClause ? "AND" : "WHERE"
             } created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month`,
      params
    );

    res.json({
      success: true,
      data: {
        stats: stats[0],
        monthlyContracts,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de contratos:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

module.exports = {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  approveContract,
  getContractStats,
};
