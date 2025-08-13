const express = require("express");
const router = express.Router();

const {
  login,
  register,
  getProfile,
} = require("../controllers/authController");

const authenticateToken = require("../middleware/authenticateToken"); // Middleware para proteger rotas

// Rota para login
router.post("/login", login);

// Rota para registro de novo usuário
router.post("/register", register);

// Rota protegida para obter o perfil do usuário logado
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
