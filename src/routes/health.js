const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Public health check endpoint - does not require an API key.
 * Expected Response: HTTP 200 with { "status": "ok" }
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

module.exports = router;
