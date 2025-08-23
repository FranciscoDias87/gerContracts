const bcrypt = require("bcryptjs");
const { query } = require("../config/database");

const getAllUsers = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    let offset = parseInt(req.query.offset, 10);

    if (isNaN(limit) || limit <= 0) limit = 10;
    if (isNaN(offset) || offset < 0) offset = 0;

    const search = req.query.search || "";
    const role = req.query.role || "";

    let whereClause = "WHERE 1=1";
    let params = [];

    if (search) {
      whereClause +=
        " AND (username LIKE ? OR full_name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += " AND role = ?";
      params.push(role);
    }

    // ATENÇÃO: Nunca use valores vindos do usuário sem validação!
    const sql = `
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const users = await query(sql, params);
    console.log("Users do Backend: ", users); // Adicione este log para ver o resultado

    // Contar total de usuários
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = totalResult[0].total;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await query(
      "SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Verificar se usuário já existe
    const existingUsers = await query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Usuário ou email já existe",
      });
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Inserir usuário
    const result = await query(
      "INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, password_hash, full_name, role]
    );

    // Buscar usuário criado
    const newUser = await query(
      "SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      data: {
        user: newUser[0],
      },
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, is_active } = req.body;

    // Verificar se usuário existe
    const existingUsers = await query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Verificar se username ou email já existem para outro usuário
    if (username || email) {
      const duplicateUsers = await query(
        "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
        [username || "", email || "", id]
      );

      if (duplicateUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Username ou email já existe para outro usuário",
        });
      }
    }

    // Atualizar usuário
    await query(
      `UPDATE users SET 
             username = COALESCE(?, username),
             email = COALESCE(?, email),
             full_name = COALESCE(?, full_name),
             role = COALESCE(?, role),
             is_active = COALESCE(?, is_active)
             WHERE id = ?`,
      [username, email, full_name, role, is_active, id]
    );

    // Buscar usuário atualizado
    const updatedUser = await query(
      "SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Usuário atualizado com sucesso",
      data: {
        user: updatedUser[0],
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const existingUsers = await query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Verificar se é o próprio usuário tentando se deletar
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Você não pode deletar sua própria conta",
      });
    }

    // Soft delete - marcar como inativo
    await query("UPDATE users SET is_active = FALSE WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Usuário desativado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Verificar se usuário existe
    const existingUsers = await query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Hash da nova senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [
      password_hash,
      id,
    ]);

    res.json({
      success: true,
      message: "Senha resetada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao resetar senha:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const getLocutors = async (req, res) => {
  try {
    const locutors = await query(
      "SELECT id, username, full_name FROM users WHERE role = ? AND is_active = TRUE ORDER BY full_name",
      ["locutor"]
    );

    res.json({
      success: true,
      data: {
        locutors,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar locutores:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getLocutors,
};
