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

loadEnv();

/**
 * Validates the 'x-api-key' header (Anti-pattern implementation)
 */
function validateApiKey(req) {
  const expectedKey = process.env.API_KEY || 'security-secret-key-2026';
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

  // Route 2: GET /api/data (Protected Static JSON)
  if (method === 'GET' && pathname === '/api/data') {
    const authResult = validateApiKey(req);
    if (!authResult.authorized) {
      return sendJson(authResult.statusCode, authResult.payload);
    }

    return sendJson(200, {
      message: 'Protected data',
      course: 'Security Exercise',
      status: 'success'
    });
  }

  // Route 3: POST /api/data (Protected Action)
  if (method === 'POST' && pathname === '/api/data') {
    const authResult = validateApiKey(req);
    if (!authResult.authorized) {
      return sendJson(authResult.statusCode, authResult.payload);
    }

    return sendJson(200, {
      message: 'POST received'
    });
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
