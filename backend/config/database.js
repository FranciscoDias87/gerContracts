const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  timezone: "+00:00",
};

let pool;

const createPool = () => {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("Pool de conexões MySQL criado com sucesso");
    return pool;
  } catch (error) {
    console.error("Erro ao criar pool de conexões:", error);
    throw error;
  }
};

const getConnection = async () => {
  try {
    if (!pool) {
      createPool();
    }
    return await pool.getConnection();
  } catch (error) {
    console.error("Erro ao obter conexão:", error);
    throw error;
  }
};

const query = async (sql, params = []) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error("Erro na query:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const transaction = async (callback) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Erro na transação:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Inicializar pool na inicialização do módulo
createPool();

module.exports = {
  pool,
  getConnection,
  query,
  transaction,
  createPool,
};
