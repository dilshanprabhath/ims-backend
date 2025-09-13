const UserService = require('../services/UserService');
const { ErrorResponseDTO } = require('../dto/UserDTO');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(new ErrorResponseDTO('Access denied. No token provided.'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = UserService.verifyToken(token);
    
    // Add user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json(new ErrorResponseDTO('Invalid token.'));
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(new ErrorResponseDTO('Authentication required.'));
    }

    const userRole = req.user.roleName;
    if (!roles.includes(userRole)) {
      return res.status(403).json(new ErrorResponseDTO('Insufficient permissions.'));
    }

    next();
  };
};

// Check if user is owner
const requireOwner = requireRole('OWNER');

// Check if user is admin or owner
const requireAdmin = requireRole('ADMIN', 'OWNER');

// Check if user is agent, admin, or owner
const requireAgent = requireRole('AGENT', 'ADMIN', 'OWNER');

module.exports = {
  verifyToken,
  requireRole,
  requireOwner,
  requireAdmin,
  requireAgent
};