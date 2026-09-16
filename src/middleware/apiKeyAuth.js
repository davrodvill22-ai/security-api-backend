/**
 * API Key Authentication Middleware (Anti-Pattern Demonstration)
 *
 * Security Anti-Pattern Details:
 * 1. Checks if the incoming HTTP request contains the custom header 'x-api-key'.
 * 2. Compares the header value directly against a static server-side secret.
 * 3. Does not provide user identity, session state, token expiration, or signature validation.
 */
function apiKeyAuth(req, res, next) {
  const expectedApiKey = process.env.API_KEY;
  const providedApiKey = req.headers['x-api-key'];

  // Check 1: Does the request contain x-api-key?
  if (!providedApiKey) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      error: 'Unauthorized',
      message: "Authentication failed: Missing required 'x-api-key' header."
    });
  }

  // Check 2: Is the provided key valid?
  if (providedApiKey !== expectedApiKey) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      error: 'Unauthorized',
      message: "Authentication failed: Invalid 'x-api-key' provided."
    });
  }

  // Valid key provided -> continue to next handler
  next();
}

module.exports = apiKeyAuth;
