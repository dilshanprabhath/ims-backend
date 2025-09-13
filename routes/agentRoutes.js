const express = require('express');
const router = express.Router();
const AgentController = require('../controllers/AgentController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// All routes require authentication and admin privileges
router.use(verifyToken);
router.use(requireAdmin);

// Agent CRUD operations
router.post('/', AgentController.createAgent);              // Create new agent
router.get('/', AgentController.getAllAgents);              // Get all agents
router.get('/:id', AgentController.getAgentById);           // Get agent by ID
router.put('/:id', AgentController.updateAgent);            // Update agent details
router.put('/:id/password', AgentController.updateAgentPassword); // Update agent password
router.put('/:id/deactivate', AgentController.deactivateAgent);   // Deactivate agent
router.put('/:id/activate', AgentController.activateAgent);       // Activate agent

module.exports = router;