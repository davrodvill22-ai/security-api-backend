const http = require('node:http');
const requestListener = require('./app');

const PORT = parseInt(process.env.PORT || '3000', 10);
const API_KEY = process.env.API_KEY || 'security-secret-key-2026';

const server = http.createServer(requestListener);

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Security API server running on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}`);
  console.log(`🔑 Configured API Key: ${API_KEY}`);
  console.log('----------------------------------------------------');
  console.log('Endpoints:');
  console.log(`  [GET]  http://localhost:${PORT}/health   (Public)`);
  console.log(`  [GET]  http://localhost:${PORT}/api/data (Protected: requires x-api-key)`);
  console.log(`  [POST] http://localhost:${PORT}/api/data (Protected: requires x-api-key)`);
  console.log('====================================================');
});

module.exports = server;
