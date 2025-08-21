const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const { authenticateToken, authorize } = require("../middleware/auth");
const {
  validateUser,
  validateUserUpdate,
  validateId,
  handleValidationErrors,
} = require("../middleware/validation");

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// Rota para obter todos os usuários (apenas admin e gerente)
router.get("/", authorize("admin", "gerente"), userController.getAllUsers);

// Rota para obter locutores (para seleção em formulários)
router.get(
  "/locutors",
  authorize("admin", "gerente"),
  userController.getLocutors
);

// Rota para obter usuário por ID
router.get(
  "/:id",
  validateId,
  authorize("admin", "gerente"),
  userController.getUserById
);

// Rota para criar usuário (apenas admin)
router.post("/", authorize("admin"), validateUser, userController.createUser);

// Rota para atualizar usuário (apenas admin)
router.put(
  "/:id",
  validateId,
  authorize("admin"),
  validateUserUpdate,
  userController.updateUser
);

// Rota para resetar senha de usuário (apenas admin)
router.put(
  "/:id/reset-password",
  validateId,
  authorize("admin"),
  [
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Nova senha deve ter pelo menos 6 caracteres"),
    handleValidationErrors,
  ],
  userController.resetPassword
);

// Rota para deletar/desativar usuário (apenas admin)
router.delete(
  "/:id",
  validateId,
  authorize("admin"),
  userController.deleteUser
);

module.exports = router;
