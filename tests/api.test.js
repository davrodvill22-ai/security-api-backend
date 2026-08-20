const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const requestListener = require('../src/app');

const VALID_KEY = process.env.API_KEY || 'security-secret-key-2026';
const INVALID_KEY = 'invalid-fake-key-99999';

let server;
let baseUrl;

describe('Security API Key Authentication Test Suite', () => {
  before((_, done) => {
    // Start server on an ephemeral port (0) to prevent conflicts during test execution
    server = http.createServer(requestListener).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      done();
    });
  });

  after((_, done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // Test 1: GET /health (Public endpoint, no API key required)
  test('Test 1 — GET /health returns 200 OK without API key', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET'
    });

    assert.equal(res.status, 200, 'Expected status 200 OK');
    const data = await res.json();
    assert.deepEqual(data, { status: 'ok' }, 'Expected status ok payload');
  });

  // Test 2: GET /api/data without API key
  test('Test 2 — GET /api/data without API key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/data`, {
      method: 'GET'
    });

    assert.equal(res.status, 401, 'Expected status 401 Unauthorized');
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  // Test 3: GET /api/data with incorrect API key
  test('Test 3 — GET /api/data with incorrect API key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/data`, {
      method: 'GET',
      headers: {
        'x-api-key': INVALID_KEY
      }
    });

    assert.equal(res.status, 401, 'Expected status 401 Unauthorized');
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  // Test 4: GET /api/data with correct API key
  test('Test 4 — GET /api/data with correct API key returns 200 OK and static JSON', async () => {
    const res = await fetch(`${baseUrl}/api/data`, {
      method: 'GET',
      headers: {
        'x-api-key': VALID_KEY
      }
    });

    assert.equal(res.status, 200, 'Expected status 200 OK');
    const data = await res.json();
    assert.deepEqual(data, {
      message: 'Protected data',
      course: 'Security Exercise',
      status: 'success'
    }, 'Expected static JSON response payload');
  });

  // Test 5: POST /api/data without API key
  test('Test 5 — POST /api/data without API key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'payload' })
    });

    assert.equal(res.status, 401, 'Expected status 401 Unauthorized');
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  // Additional: POST /api/data with incorrect API key
  test('Additional — POST /api/data with incorrect API key returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/data`, {
      method: 'POST',
      headers: {
        'x-api-key': INVALID_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'payload' })
    });

    assert.equal(res.status, 401, 'Expected status 401 Unauthorized');
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  // Test 6: POST /api/data with correct API key
  test('Test 6 — POST /api/data with correct API key returns 200 OK and confirmation message', async () => {
    const res = await fetch(`${baseUrl}/api/data`, {
      method: 'POST',
      headers: {
        'x-api-key': VALID_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ item: 'sample data' })
    });

    assert.equal(res.status, 200, 'Expected status 200 OK');
    const data = await res.json();
    assert.deepEqual(data, {
      message: 'POST received'
    }, 'Expected confirmation payload');
  });

  // Test CORS headers & Preflight
  test('CORS Preflight Test — OPTIONS /api/data returns 204 with CORS headers', async () => {
    const res = await fetch(`${baseUrl}/api/data`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'x-api-key, Content-Type'
      }
    });

    assert.equal(res.status, 204, 'Expected status 204 No Content for OPTIONS preflight');
    assert.equal(res.headers.get('access-control-allow-origin'), '*', 'Expected allow origin *');
    assert.ok(res.headers.get('access-control-allow-headers').includes('x-api-key'), 'Expected x-api-key in allowed headers');
  });
});
