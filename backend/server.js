const app = require('./src/app');
const { createPool } = require('./src/config/database');

const PORT = process.env.PORT || 3001;

// Inicializar pool de conexões do banco de dados
createPool();

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em: http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Fechando servidor graciosamente...');
    server.close(() => {
        console.log('Servidor fechado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido. Fechando servidor graciosamente...');
    server.close(() => {
        console.log('Servidor fechado.');
        process.exit(0);
    });
});

module.exports = server;

