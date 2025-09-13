// controllers/AgentController.js
const UserService = require('../services/UserService');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { ErrorResponseDTO } = require('../dto/UserDTO');

class AgentController {

  // Create new agent with additional fields including company address
  async createAgent(req, res) {
    try {
      const { email, username, password, fullName, contactNumber, companyName, companyAddress } = req.body;
      
      console.log('Creating agent with data:', { email, username, fullName, contactNumber, companyName, companyAddress });
      
      // Validation
      if (!email || !username || !password || !fullName) {
        return res.status(400).json(new ErrorResponseDTO('Email, username, password, and full name are required'));
      }

      if (password.length < 6) {
        return res.status(400).json(new ErrorResponseDTO('Password must be at least 6 characters'));
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json(new ErrorResponseDTO('Invalid email format'));
      }

      // Validate contact number if provided
      if (contactNumber && !/^[\+]?[\d\s\-\(\)]{10,15}$/.test(contactNumber)) {
        return res.status(400).json(new ErrorResponseDTO('Invalid contact number format'));
      }

      // Check if email already exists
      const existingUser = await UserService.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json(new ErrorResponseDTO('Email already exists'));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new agent (role_id = 3 for AGENT) with additional fields including company address
      const query = `
        INSERT INTO IMS_USERS_MASTER_TBL 
        (ROLE_ID, USER_KEY, EMAIL, USERNAME, FULL_NAME, CONTACT_NUMBER, COMPANY_NAME, COMPANY_ADDRESS, STATUS) 
        VALUES (3, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `;
      
      const [result] = await pool.execute(query, [
        hashedPassword, 
        email, 
        username, 
        fullName,
        contactNumber || null,
        companyName || null,
        companyAddress || null
      ]);

      res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: {
          userId: result.insertId,
          email: email,
          username: username,
          fullName: fullName,
          contactNumber: contactNumber,
          companyName: companyName,
          companyAddress: companyAddress,
          role: 'AGENT'
        }
      });

    } catch (error) {
      console.error('Create agent error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to create agent'));
    }
  }

  // Get all agents with additional fields including company address
  async getAllAgents(req, res) {
    try {
      const query = `
        SELECT 
          u.USER_ID, u.EMAIL, u.USERNAME, u.FULL_NAME, u.CONTACT_NUMBER, 
          u.COMPANY_NAME, u.COMPANY_ADDRESS, u.STATUS, u.CREATED_DATE, u.UPDATED_DATE,
          r.ROLE_NAME
        FROM IMS_USERS_MASTER_TBL u
        LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
        WHERE u.ROLE_ID = 3
        ORDER BY u.CREATED_DATE DESC
      `;

      const [agents] = await pool.execute(query);

      res.status(200).json({
        success: true,
        message: 'Agents retrieved successfully',
        data: agents
      });

    } catch (error) {
      console.error('Get agents error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to retrieve agents'));
    }
  }

  // Get agent by ID with additional fields including company address
  async getAgentById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          u.USER_ID, u.EMAIL, u.USERNAME, u.FULL_NAME, u.CONTACT_NUMBER, 
          u.COMPANY_NAME, u.COMPANY_ADDRESS, u.STATUS, u.CREATED_DATE, u.UPDATED_DATE,
          r.ROLE_NAME
        FROM IMS_USERS_MASTER_TBL u
        LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
        WHERE u.USER_ID = ? AND u.ROLE_ID = 3
      `;

      const [agents] = await pool.execute(query, [id]);

      if (agents.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Agent not found'));
      }

      res.status(200).json({
        success: true,
        message: 'Agent retrieved successfully',
        data: agents[0]
      });

    } catch (error) {
      console.error('Get agent by ID error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to retrieve agent'));
    }
  }

  // Update agent with additional fields including company address
  async updateAgent(req, res) {
    try {
      const { id } = req.params;
      const { email, username, fullName, contactNumber, companyName, companyAddress, status } = req.body;

      // Check if agent exists
      const checkQuery = `SELECT USER_ID FROM IMS_USERS_MASTER_TBL WHERE USER_ID = ? AND ROLE_ID = 3`;
      const [existing] = await pool.execute(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Agent not found'));
      }

      // Check if new email already exists (if email is being changed)
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json(new ErrorResponseDTO('Invalid email format'));
        }

        const emailCheckQuery = `SELECT USER_ID FROM IMS_USERS_MASTER_TBL WHERE EMAIL = ? AND USER_ID != ?`;
        const [emailExists] = await pool.execute(emailCheckQuery, [email, id]);
        
        if (emailExists.length > 0) {
          return res.status(400).json(new ErrorResponseDTO('Email already exists'));
        }
      }

      // Validate contact number if provided
      if (contactNumber && !/^[\+]?[\d\s\-\(\)]{10,15}$/.test(contactNumber)) {
        return res.status(400).json(new ErrorResponseDTO('Invalid contact number format'));
      }

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (email) {
        updates.push('EMAIL = ?');
        values.push(email);
      }
      if (username) {
        updates.push('USERNAME = ?');
        values.push(username);
      }
      if (fullName) {
        updates.push('FULL_NAME = ?');
        values.push(fullName);
      }
      if (contactNumber !== undefined) {
        updates.push('CONTACT_NUMBER = ?');
        values.push(contactNumber || null);
      }
      if (companyName !== undefined) {
        updates.push('COMPANY_NAME = ?');
        values.push(companyName || null);
      }
      if (companyAddress !== undefined) {
        updates.push('COMPANY_ADDRESS = ?');
        values.push(companyAddress || null);
      }
      if (status) {
        updates.push('STATUS = ?');
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json(new ErrorResponseDTO('No fields to update'));
      }

      updates.push('UPDATED_DATE = CURRENT_TIMESTAMP');
      values.push(id);

      const updateQuery = `UPDATE IMS_USERS_MASTER_TBL SET ${updates.join(', ')} WHERE USER_ID = ?`;
      await pool.execute(updateQuery, values);

      res.status(200).json({
        success: true,
        message: 'Agent updated successfully'
      });

    } catch (error) {
      console.error('Update agent error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to update agent'));
    }
  }

  // Update agent password
  async updateAgentPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json(new ErrorResponseDTO('Password must be at least 6 characters'));
      }

      // Check if agent exists
      const checkQuery = `SELECT USER_ID FROM IMS_USERS_MASTER_TBL WHERE USER_ID = ? AND ROLE_ID = 3`;
      const [existing] = await pool.execute(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Agent not found'));
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const updateQuery = `UPDATE IMS_USERS_MASTER_TBL SET USER_KEY = ?, UPDATED_DATE = CURRENT_TIMESTAMP WHERE USER_ID = ?`;
      await pool.execute(updateQuery, [hashedPassword, id]);

      res.status(200).json({
        success: true,
        message: 'Agent password updated successfully'
      });

    } catch (error) {
      console.error('Update agent password error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to update agent password'));
    }
  }

  // Deactivate agent (soft delete)
  async deactivateAgent(req, res) {
    try {
      const { id } = req.params;

      // Check if agent exists and is active
      const checkQuery = `SELECT USER_ID, STATUS FROM IMS_USERS_MASTER_TBL WHERE USER_ID = ? AND ROLE_ID = 3`;
      const [existing] = await pool.execute(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Agent not found'));
      }

      if (existing[0].STATUS === 'INACTIVE') {
        return res.status(400).json(new ErrorResponseDTO('Agent is already inactive'));
      }

      // Deactivate agent
      const updateQuery = `UPDATE IMS_USERS_MASTER_TBL SET STATUS = 'INACTIVE', UPDATED_DATE = CURRENT_TIMESTAMP WHERE USER_ID = ?`;
      await pool.execute(updateQuery, [id]);

      res.status(200).json({
        success: true,
        message: 'Agent deactivated successfully'
      });

    } catch (error) {
      console.error('Deactivate agent error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to deactivate agent'));
    }
  }

  // Activate agent
  async activateAgent(req, res) {
    try {
      const { id } = req.params;

      // Check if agent exists and is inactive
      const checkQuery = `SELECT USER_ID, STATUS FROM IMS_USERS_MASTER_TBL WHERE USER_ID = ? AND ROLE_ID = 3`;
      const [existing] = await pool.execute(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Agent not found'));
      }

      if (existing[0].STATUS === 'ACTIVE') {
        return res.status(400).json(new ErrorResponseDTO('Agent is already active'));
      }

      // Activate agent
      const updateQuery = `UPDATE IMS_USERS_MASTER_TBL SET STATUS = 'ACTIVE', UPDATED_DATE = CURRENT_TIMESTAMP WHERE USER_ID = ?`;
      await pool.execute(updateQuery, [id]);

      res.status(200).json({
        success: true,
        message: 'Agent activated successfully'
      });

    } catch (error) {
      console.error('Activate agent error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to activate agent'));
    }
  }
}

module.exports = new AgentController();