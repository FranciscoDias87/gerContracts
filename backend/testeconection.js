// test-db-connection.js
require("dotenv").config();
const mysql = require("mysql2/promise");

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    console.log("Conexão com banco MySQL estabelecida com sucesso!");

    // Testar uma query simples
    const [rows] = await connection.query("SELECT NOW() AS currentTime");
    console.log("Hora atual do banco:", rows[0].currentTime);

    connection.release();
    pool.end();
  } catch (error) {
    console.error("Erro ao conectar com banco de dados:", error);
  }
}

testConnection();
