# 🛡️ Security API — API Key Authentication Anti-Pattern

A Node.js & Express REST API designed to demonstrate and analyze the **API Key Authentication Anti-Pattern**, where a static custom HTTP header (`x-api-key`) is used for client-side authentication without proper identity federation, token rotation, or server-side authorization mechanisms.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Endpoints Summary](#endpoints-summary)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Server](#running-the-server)
- [Automated Testing](#automated-testing)
- [Manual Testing (cURL & PowerShell)](#manual-testing-curl--powershell)
- [Security Analysis: Why is this an Anti-Pattern?](#security-analysis-why-is-this-an-anti-pattern)
- [Proper Security Alternatives](#proper-security-alternatives)
- [Project Structure](#project-structure)

---

## 🔍 Overview

In modern web development, API keys are often misused as a substitute for user authentication. This backend exposes public and protected endpoints to illustrate:

1. How simple header-based checking operates:
   - Inspects `x-api-key` header on incoming requests.
   - Returns `200 OK` on match or `401 Unauthorized` on absence/mismatch.
2. Why this architecture fails when consumed directly by frontend/client applications.

---

## 🏛️ Architecture

```
                       +-----------------------------------+
                       |           HTTP Client             |
                       | (Browser, Postman, cURL, Fetch)   |
                       +-----------------+-----------------+
                                         |
                                         | HTTP Request (with or without x-api-key)
                                         v
                       +-----------------------------------+
                       |         Express Backend           |
                       |       (http://localhost:3000)     |
                       +-----------------+-----------------+
                                         |
            +----------------------------+----------------------------+
            |                                                         |
            v                                                         v
    [GET /health]                                            [/api/data (GET / POST)]
    (Public Endpoint)                                        (Protected by apiKeyAuth)
            |                                                         |
            v                                                         v
    Returns 200 OK                                           +-----------------+
    {"status": "ok"}                                         | Check x-api-key |
                                                             +--------+--------+
                                                                      |
                                                   +------------------+------------------+
                                                   |                                     |
                                            Missing / Invalid                          Valid
                                                   |                                     |
                                                   v                                     v
                                            Returns 401                           Returns 200 OK
                                            Unauthorized                          Data / Confirmation
```

---

## 📡 Endpoints Summary

| Method | Endpoint    | Auth Required | Header                     | Expected Status | Description                   |
| :----- | :---------- | :------------ | :------------------------- | :-------------- | :---------------------------- |
| `GET`  | `/health`   | ❌ None       | None                       | `200 OK`        | Service health check          |
| `GET`  | `/api/data` | ✅ Yes        | `x-api-key: <your-api-key>`| `200 OK` / `401`| Retrieves protected static JSON |
| `POST` | `/api/data` | ✅ Yes        | `x-api-key: <your-api-key>`| `200 OK` / `401`| Submits data (returns confirmation) |

---

## 📦 Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on Node.js v22.x)
- **npm**: `v9.0.0` or higher

---

## ⚙️ Installation

1. Navigate to the backend directory:
   ```bash
   cd security-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🔧 Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Default variables in `.env`:

```env
PORT=3000
API_KEY=security-secret-key-2026
```

| Variable  | Default                     | Description                             |
| :-------- | :-------------------------- | :-------------------------------------- |
| `PORT`    | `3000`                      | HTTP port the Express server listens on |
| `API_KEY` | `security-secret-key-2026`  | Static secret key validated by the API  |

---

## 🚀 Running the Server

### Production Mode
```bash
npm start
```

### Development Mode (with live reload)
```bash
npm run dev
```

Output:
```
====================================================
🚀 Security API server running on port 3000
📡 Base URL: http://localhost:3000
🔑 Configured API Key: security-secret-key-2026
----------------------------------------------------
Endpoints:
  [GET]  http://localhost:3000/health   (Public)
  [GET]  http://localhost:3000/api/data (Protected: requires x-api-key)
  [POST] http://localhost:3000/api/data (Protected: requires x-api-key)
====================================================
```

---

## 🧪 Automated Testing

The backend includes a test suite built using Node's native test runner (`node:test`).

Run all tests:
```bash
npm test
```

### Test Cases Covered:
- **Test 1**: `GET /health` returns `200 OK` without API key.
- **Test 2**: `GET /api/data` without `x-api-key` returns `401 Unauthorized`.
- **Test 3**: `GET /api/data` with invalid `x-api-key` returns `401 Unauthorized`.
- **Test 4**: `GET /api/data` with valid `x-api-key` returns `200 OK` and payload.
- **Test 5**: `POST /api/data` without `x-api-key` returns `401 Unauthorized`.
- **Test 6**: `POST /api/data` with valid `x-api-key` returns `200 OK` and confirmation.

---

## 🔬 Manual Testing (cURL & PowerShell)

### Test 1 — Health Check (Public)
```bash
# cURL
curl -i http://localhost:3000/health

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
```
**Expected Response:** `200 OK`
```json
{
  "status": "ok"
}
```

---

### Test 2 — GET Protected Data without API Key
```bash
# cURL
curl -i http://localhost:3000/api/data

# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/data" -Method Get
```
**Expected Response:** `401 Unauthorized`
```json
{
  "status": "error",
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication failed: Missing required 'x-api-key' header."
}
```

---

### Test 3 — GET Protected Data with Wrong API Key
```bash
# cURL
curl -i -H "x-api-key: wrong-key-123" http://localhost:3000/api/data

# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/data" -Headers @{"x-api-key"="wrong-key-123"} -Method Get
```
**Expected Response:** `401 Unauthorized`
```json
{
  "status": "error",
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication failed: Invalid 'x-api-key' provided."
}
```

---

### Test 4 — GET Protected Data with Correct API Key
```bash
# cURL
curl -i -H "x-api-key: security-secret-key-2026" http://localhost:3000/api/data

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/data" -Headers @{"x-api-key"="security-secret-key-2026"} -Method Get
```
**Expected Response:** `200 OK`
```json
{
  "message": "Protected data",
  "course": "Security Exercise",
  "status": "success"
}
```

---

### Test 5 — POST Protected Endpoint without API Key
```bash
# cURL
curl -i -X POST http://localhost:3000/api/data

# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/data" -Method Post
```
**Expected Response:** `401 Unauthorized`

---

### Test 6 — POST Protected Endpoint with Correct API Key
```bash
# cURL
curl -i -X POST -H "x-api-key: security-secret-key-2026" http://localhost:3000/api/data

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/data" -Headers @{"x-api-key"="security-secret-key-2026"} -Method Post
```
**Expected Response:** `200 OK`
```json
{
  "message": "POST received"
}
```

---

## ⚠️ Security Analysis: Why is this an Anti-Pattern?

Implementing authentication solely using a shared static `x-api-key` header between a public frontend and backend introduces severe security vulnerabilities:

### 1. Secret Exposure in Client-Side Code
Any secret embedded in JavaScript (`app.js`), environment bundles, or config files sent to the browser is public. Anyone can open DevTools (F12) -> **Sources** or **Network** tab and extract the key immediately.

### 2. Lack of User Identity & Context
A static API key identifies the *software client*, not the *individual user*. The server cannot distinguish between User A and User B, making Role-Based Access Control (RBAC), auditing, and session tracking impossible.

### 3. No Expiration or Rotation Strategy
Unlike session tokens or JWTs with an expiration (`exp`) timestamp, API keys are static. If leaked, an attacker has permanent access until an administrator manually changes the key across all clients and servers.

### 4. Blast Radius of Compromise
Because all frontend clients share the same API key, a single leak compromises the entire system.

---

## 🛡️ Proper Security Alternatives

| Anti-Pattern Mechanism | Recommended Secure Architecture |
| :--------------------- | :------------------------------ |
| Static `x-api-key` in frontend | **OAuth 2.0 / OpenID Connect (OIDC)** with PKCE for Single Page Applications (SPAs) |
| Hardcoded client secrets | **Backend-for-Frontend (BFF)** pattern where a secure server-side proxy handles upstream API secrets |
| Non-expiring static tokens | **Short-lived JSON Web Tokens (JWT)** with secure refresh token rotation |
| Accessible via client JS | **HttpOnly, Secure, SameSite cookies** to prevent XSS credential theft |

---

## 📂 Project Structure

```
security-api/
├── .env.example              # Template environment variables
├── .env                      # Local environment file (git-ignored)
├── .gitignore                # Git ignore rules
├── package.json              # Project metadata & dependencies
├── src/
│   ├── app.js                # Express app setup, CORS, and routing
│   ├── server.js             # HTTP server entry point
│   ├── middleware/
│   │   └── apiKeyAuth.js     # Header authentication middleware
│   └── routes/
│       ├── health.js         # Public GET /health route
│       └── data.js           # Protected GET & POST /api/data routes
├── tests/
│   └── api.test.js           # Automated test suite
└── README.md                 # Project documentation
```

---

## 📄 License

This project is created for educational and academic cybersecurity demonstration purposes under the MIT License.
