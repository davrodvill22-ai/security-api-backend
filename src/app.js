const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

// Lightweight built-in .env parser (Zero dependencies required)
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim();
          }
        }
      });
    } catch (e) {
      console.warn('Could not read .env file, using default values.');
    }
  }
}

// Load variables BEFORE requiring services
loadEnv();

const cryptoService = require('./services/cryptoService');
const db = require('./services/db');
const ldapService = require('./services/ldapService');

// Initialize real database table
db.initDB();

loadEnv();

/**
 * Validates the 'x-api-key' header (Anti-pattern implementation)
 */
function validateApiKey(req) {
  loadEnv(); // Recargar .env en cada petición para la rotación automática en vivo
  const expectedKey = process.env.API_KEY;
  // Node.js lowercases all incoming header names
  const providedKey = req.headers['x-api-key'];

  if (!providedKey) {
    return {
      authorized: false,
      statusCode: 401,
      payload: {
        status: 'error',
        statusCode: 401,
        error: 'Unauthorized',
        message: "Authentication failed: Missing required 'x-api-key' header."
      }
    };
  }

  if (providedKey !== expectedKey) {
    return {
      authorized: false,
      statusCode: 401,
      payload: {
        status: 'error',
        statusCode: 401,
        error: 'Unauthorized',
        message: "Authentication failed: Invalid 'x-api-key' provided."
      }
    };
  }

  return { authorized: true };
}

/**
 * Main HTTP Request Handler
 */
function requestListener(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const method = req.method.toUpperCase();

  // Helper to send JSON responses
  const sendJson = (statusCode, payload) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
    });
    res.end(JSON.stringify(payload, null, 2));
  };

  // Handle CORS Preflight OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // Request Logging
  const apiKeyHeader = req.headers['x-api-key'] ? `[x-api-key: ${req.headers['x-api-key']}]` : '[No x-api-key]';
  console.log(`[${new Date().toISOString()}] ${method} ${pathname} - ${apiKeyHeader}`);

  // Route 1: GET /health (Public Health Check)
  if (method === 'GET' && pathname === '/health') {
    return sendJson(200, {
      status: 'ok'
    });
  }

  // Route 2: GET /api/data (Protected Database JSON)
  if (method === 'GET' && pathname === '/api/data') {
    const authResult = validateApiKey(req);
    if (!authResult.authorized) {
      return sendJson(authResult.statusCode, authResult.payload);
    }

    db.pool.query('SELECT * FROM encrypted_messages ORDER BY id DESC LIMIT 50')
      .then(([rows]) => {
        const decryptedRecords = rows.map(row => {
          try {
            return JSON.parse(cryptoService.decrypt(row.encrypted_data));
          } catch (e) {
            return { error: 'Failed to decrypt', id: row.id };
          }
        });

        return sendJson(200, {
          message: 'Protected data retrieved and decrypted from MySQL DB',
          records: decryptedRecords,
          status: 'success'
        });
      })
      .catch(err => {
        return sendJson(500, { error: 'Database error', details: err.message });
      });
    return;
  }

  // Route 3: POST /api/data (Protected Action)
  if (method === 'POST' && pathname === '/api/data') {
    const authResult = validateApiKey(req);
    if (!authResult.authorized) {
      return sendJson(authResult.statusCode, authResult.payload);
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedData = JSON.parse(body || '{}');
        const encryptedData = cryptoService.encrypt(JSON.stringify(parsedData));
        
        db.pool.query('INSERT INTO encrypted_messages (encrypted_data) VALUES (?)', [encryptedData])
          .then(([result]) => {
            return sendJson(200, {
              message: 'POST received and encrypted safely into MySQL DB',
              inserted_id: result.insertId
            });
          })
          .catch(err => {
            return sendJson(500, { error: 'Database insert error', details: err.message });
          });
      } catch (e) {
        return sendJson(400, { error: 'Bad JSON', details: e.message });
      }
    });
    return; // Wait for end event
  }

  // Route 4: POST /api/login (Public LDAP authentication)
  if (method === 'POST' && pathname === '/api/login') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body || '{}');
        if (!username || !password) {
          return sendJson(400, { error: 'Faltan credenciales' });
        }
        
        const authResult = await ldapService.loginWithLDAP(username, password);
        
        if (authResult.success) {
          return sendJson(200, {
            message: 'Login exitoso',
            user: authResult.user
          });
        } else {
          return sendJson(401, { error: authResult.error });
        }
      } catch (e) {
        return sendJson(400, { error: 'Bad JSON', details: e.message });
      }
    });
    return;
  }

  // 404 Not Found
  return sendJson(404, {
    status: 'error',
    statusCode: 404,
    error: 'Not Found',
    message: `Cannot ${method} ${pathname}`
  });
}

module.exports = requestListener;
