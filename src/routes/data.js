const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKeyAuth');

// Apply apiKeyAuth middleware to all /api/data routes
router.use(apiKeyAuth);

/**
 * GET /api/data
 * Protected endpoint - requires valid x-api-key header.
 * Expected Response: HTTP 200 with static JSON payload
 */
router.get('/data', (req, res) => {
  res.status(200).json({
    message: 'Protected data',
    course: 'Security Exercise',
    status: 'success'
  });
});

/**
 * POST /api/data
 * Protected endpoint - requires valid x-api-key header.
 * Body can be ignored for this exercise.
 * Expected Response: HTTP 200 with confirmation message
 */
router.post('/data', (req, res) => {
  res.status(200).json({
    message: 'POST received'
  });
});

module.exports = router;
