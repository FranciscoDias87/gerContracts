const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const dbName = process.env.DB_NAME || "default_db";

function withDB(table) {
  return `${dbName}.${table}`;
}

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuário no banco de dados
    const users = await query(
      `SELECT id, username, email, password_hash, full_name, role, is_active FROM ${withDB(
        "users"
      )} WHERE username = ? AND is_active = TRUE`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    const user = users[0];

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    // Gerar token JWT
    const token = generateToken(user.id, user.role);

    // Remover senha do objeto de resposta
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Verificar se usuário já existe
    const existingUsers = await query(
      `SELECT id FROM users WHERE ${withDB("username")} = ? OR email = ?`,
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

    // Inserir usuário no banco de dados
    const result = await query(
      `INSERT INTO ${withDb(
        "users"
      )} (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      [username, email, password_hash, full_name, role]
    );

    // Buscar usuário criado
    const newUser = await query(
      `SELECT id, username, email, full_name, role, is_active, created_at FROM ${withDB(
        "users"
      )} WHERE id = ?`,
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
    console.error("Erro no registro:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await query(
      `SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM ${withDB(
        "users"
      )} WHERE id = ?`,
      [userId]
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
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email } = req.body;

    // Verificar se email já existe para outro usuário
    if (email) {
      const existingUsers = await query(
        `SELECT id FROM ${withDB("users")} WHERE email = ? AND id != ?`,
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email já está em uso por outro usuário",
        });
      }
    }

    // Atualizar usuário
    await query(
      `UPDATE ${withDB(
        "users"
      )} SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE id = ?`,
      [full_name, email, userId]
    );

    // Buscar usuário atualizado
    const updatedUser = await query(
      `SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM ${withDB(
        "users"
      )} WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: {
        user: updatedUser[0],
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Buscar usuário atual
    const users = await query(
      `SELECT password_hash FROM ${withDB("users")} WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      users[0].password_hash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Senha atual incorreta",
      });
    }

    // Hash da nova senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await query(
      `UPDATE ${withDB("users")} SET password_hash = ? WHERE id = ?`,
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
};
