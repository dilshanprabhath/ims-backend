// controllers/OrderController.js
const { pool } = require('../config/database');
const { ErrorResponseDTO } = require('../dto/UserDTO');

class OrderController {

  // Get all orders with product and agent details
  async getAllOrders(req, res) {
    try {
      const query = `
        SELECT 
          o.ORDER_ID,
          o.DESCRIPTION,
          o.QUANTITY,
          o.COMPANY_NAME,
          o.STATUS,
          o.CREATED_DATE,
          o.UPDATED_DATE,
          p.PRODUCT_NAME,
          p.CATEGORY as PRODUCT_CATEGORY,
          p.UNIT_PRICE,
          u.FULL_NAME as AGENT_NAME,
          u.EMAIL as AGENT_EMAIL,
          u.CONTACT_NUMBER as AGENT_CONTACT
        FROM ORDERS o
        LEFT JOIN PRODUCTS p ON o.PRODUCT_ID = p.PRODUCT_ID
        LEFT JOIN IMS_USERS_MASTER_TBL u ON o.AGENT_ID = u.USER_ID
        ORDER BY o.CREATED_DATE DESC
      `;

      const [orders] = await pool.execute(query);

      res.status(200).json({
        success: true,
        message: 'Orders retrieved successfully',
        data: orders
      });

    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to retrieve orders'));
    }
  }

  // Get orders by status
  async getOrdersByStatus(req, res) {
    try {
      const { status } = req.params;
      
      // Validate status
      const validStatuses = ['PENDING', 'COMPLETED', 'REJECTED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json(new ErrorResponseDTO('Invalid status. Must be PENDING, COMPLETED, or REJECTED'));
      }

      const query = `
        SELECT 
          o.ORDER_ID,
          o.DESCRIPTION,
          o.QUANTITY,
          o.COMPANY_NAME,
          o.STATUS,
          o.CREATED_DATE,
          o.UPDATED_DATE,
          p.PRODUCT_NAME,
          p.CATEGORY as PRODUCT_CATEGORY,
          p.UNIT_PRICE,
          u.FULL_NAME as AGENT_NAME,
          u.EMAIL as AGENT_EMAIL,
          u.CONTACT_NUMBER as AGENT_CONTACT
        FROM ORDERS o
        LEFT JOIN PRODUCTS p ON o.PRODUCT_ID = p.PRODUCT_ID
        LEFT JOIN IMS_USERS_MASTER_TBL u ON o.AGENT_ID = u.USER_ID
        WHERE o.STATUS = ?
        ORDER BY o.CREATED_DATE DESC
      `;

      const [orders] = await pool.execute(query, [status.toUpperCase()]);

      res.status(200).json({
        success: true,
        message: `${status} orders retrieved successfully`,
        data: orders
      });

    } catch (error) {
      console.error('Get orders by status error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to retrieve orders'));
    }
  }

  // Create new order
  async createOrder(req, res) {
    try {
      const { description, productId, quantity, companyName, agentId } = req.body;
      const createdBy = req.user.userId;

      // Validation
      if (!description || !productId || !quantity || !companyName) {
        return res.status(400).json(new ErrorResponseDTO('Description, product ID, quantity, and company name are required'));
      }

      if (quantity <= 0) {
        return res.status(400).json(new ErrorResponseDTO('Quantity must be greater than 0'));
      }

      // Check if product exists
      const productQuery = 'SELECT PRODUCT_ID, PRODUCT_NAME FROM PRODUCTS WHERE PRODUCT_ID = ? AND STATUS = "ACTIVE"';
      const [products] = await pool.execute(productQuery, [productId]);

      if (products.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Product not found or inactive'));
      }

      // Check if agent exists (if provided)
      if (agentId) {
        const agentQuery = 'SELECT USER_ID FROM IMS_USERS_MASTER_TBL WHERE USER_ID = ? AND ROLE_ID = 3 AND STATUS = "ACTIVE"';
        const [agents] = await pool.execute(agentQuery, [agentId]);

        if (agents.length === 0) {
          return res.status(404).json(new ErrorResponseDTO('Agent not found or inactive'));
        }
      }

      const insertQuery = `
        INSERT INTO ORDERS (DESCRIPTION, PRODUCT_ID, QUANTITY, COMPANY_NAME, AGENT_ID, STATUS, CREATED_BY)
        VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
      `;

      const [result] = await pool.execute(insertQuery, [
        description,
        productId,
        quantity,
        companyName,
        agentId || null,
        createdBy
      ]);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          orderId: result.insertId,
          status: 'PENDING'
        }
      });

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to create order'));
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['PENDING', 'COMPLETED', 'REJECTED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json(new ErrorResponseDTO('Invalid status. Must be PENDING, COMPLETED, or REJECTED'));
      }

      // Check if order exists
      const checkQuery = 'SELECT ORDER_ID, STATUS FROM ORDERS WHERE ORDER_ID = ?';
      const [existing] = await pool.execute(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Order not found'));
      }

      // Update order status
      const updateQuery = 'UPDATE ORDERS SET STATUS = ?, UPDATED_DATE = CURRENT_TIMESTAMP WHERE ORDER_ID = ?';
      await pool.execute(updateQuery, [status.toUpperCase(), id]);

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully'
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to update order status'));
    }
  }

  // Get all products
  async getAllProducts(req, res) {
    try {
      const query = `
        SELECT 
          PRODUCT_ID,
          PRODUCT_NAME,
          PRODUCT_DESCRIPTION,
          CATEGORY,
          UNIT_PRICE,
          STOCK_QUANTITY,
          MIN_STOCK_LEVEL,
          STATUS
        FROM PRODUCTS
        WHERE STATUS = 'ACTIVE'
        ORDER BY PRODUCT_NAME
      `;

      const [products] = await pool.execute(query);

      res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        data: products
      });

    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to retrieve products'));
    }
  }

  // Get order statistics
  async getOrderStatistics(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN STATUS = 'PENDING' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN STATUS = 'REJECTED' THEN 1 ELSE 0 END) as rejected_orders,
          COUNT(DISTINCT COMPANY_NAME) as total_companies
        FROM ORDERS
      `;

      const [stats] = await pool.execute(statsQuery);

      res.status(200).json({
        success: true,
        message: 'Order statistics retrieved successfully',
        data: stats[0]
      });

    } catch (error) {
      console.error('Get order statistics error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to retrieve order statistics'));
    }
  }

  // Delete order (for testing purposes)
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      // Check if order exists
      const checkQuery = 'SELECT ORDER_ID FROM ORDERS WHERE ORDER_ID = ?';
      const [existing] = await pool.execute(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json(new ErrorResponseDTO('Order not found'));
      }

      // Delete order
      const deleteQuery = 'DELETE FROM ORDERS WHERE ORDER_ID = ?';
      await pool.execute(deleteQuery, [id]);

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully'
      });

    } catch (error) {
      console.error('Delete order error:', error);
      res.status(500).json(new ErrorResponseDTO('Failed to delete order'));
    }
  }
}

module.exports = new OrderController();