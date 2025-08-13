const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// Middlewares de segurança
app.use(helmet());

// CORS - permitir requisições de qualquer origem
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de 100 requests por IP
  message: {
    success: false,
    message: "Muitas requisições. Tente novamente em alguns minutos.",
  },
});
app.use(limiter);

// Logging
app.use(morgan("combined"));

// Parsing de JSON e URL encoded
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos (uploads)
app.use("/uploads", express.static("uploads"));

// Importar rotas
const authRoutes = require("../routes/auth");
const userRoutes = require("../routes/users");
const clientRoutes = require("../routes/clients");
const contractRoutes = require("../routes/contracts");

// Usar rotas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/contracts", contractRoutes);

// Rota de health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando corretamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Rota para servir informações da API
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API de Gerenciamento de Contratos de Rádio",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      clients: "/api/clients",
      contracts: "/api/contracts",
    },
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada",
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error("Erro não tratado:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Tratamento de erros não capturados
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

module.exports = app;
