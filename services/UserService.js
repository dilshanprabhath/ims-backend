// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { pool } = require('../config/database');
// const { UserProfileDTO } = require('../dto/UserDTO');

// class UserService {
  
//   // Find user by email with role information
//   async findUserByEmail(email) {
//     const query = `
//       SELECT 
//         u.USER_ID, u.ROLE_ID, u.USER_KEY, u.EMAIL, u.USERNAME, u.STATUS, u.CREATED_DATE,
//         r.ROLE_NAME
//       FROM IMS_USERS_MASTER_TBL u
//       LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
//       WHERE u.EMAIL = ? AND u.STATUS = 'ACTIVE'
//     `;
    
//     try {
//       const [rows] = await pool.execute(query, [email]);
//       return rows.length > 0 ? rows[0] : null;
//     } catch (error) {
//       console.error('Error finding user by email:', error);
//       throw new Error('Database error occurred');
//     }
//   }

//   // Verify user credentials
//   async verifyCredentials(email, password) {
//     const user = await this.findUserByEmail(email);
    
//     if (!user) {
//       return { success: false, message: 'Invalid email or password' };
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.USER_KEY);
    
//     if (!isPasswordValid) {
//       return { success: false, message: 'Invalid email or password' };
//     }

//     return { success: true, user };
//   }

//   // Generate JWT token
//   generateToken(user) {
//     const payload = {
//       userId: user.USER_ID,
//       email: user.EMAIL,
//       roleId: user.ROLE_ID,
//       roleName: user.ROLE_NAME
//     };

//     return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
//       expiresIn: process.env.JWT_EXPIRES_IN || '24h'
//     });
//   }

//   // Get user profile
//   async getUserProfile(userId) {
//     const query = `
//       SELECT 
//         u.USER_ID, u.ROLE_ID, u.EMAIL, u.USERNAME, u.STATUS, u.CREATED_DATE,
//         r.ROLE_NAME
//       FROM IMS_USERS_MASTER_TBL u
//       LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
//       WHERE u.USER_ID = ? AND u.STATUS = 'ACTIVE'
//     `;
    
//     try {
//       const [rows] = await pool.execute(query, [userId]);
//       if (rows.length === 0) {
//         throw new Error('User not found');
//       }
      
//       return new UserProfileDTO(rows[0]);
//     } catch (error) {
//       console.error('Error getting user profile:', error);
//       throw new Error('Failed to fetch user profile');
//     }
//   }

//   // Validate JWT token
//   verifyToken(token) {
//     try {
//       return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
//     } catch (error) {
//       throw new Error('Invalid or expired token');
//     }
//   }

//   // Get all users (admin functionality)
//   async getAllUsers() {
//     const query = `
//       SELECT 
//         u.USER_ID, u.ROLE_ID, u.EMAIL, u.USERNAME, u.STATUS, u.CREATED_DATE,
//         r.ROLE_NAME
//       FROM IMS_USERS_MASTER_TBL u
//       LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
//       ORDER BY u.CREATED_DATE DESC
//     `;
    
//     try {
//       const [rows] = await pool.execute(query);
//       return rows.map(user => new UserProfileDTO(user));
//     } catch (error) {
//       console.error('Error getting all users:', error);
//       throw new Error('Failed to fetch users');
//     }
//   }
// }

// module.exports = new UserService();

// services/UserService.js - Debug version
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { UserProfileDTO } = require('../dto/UserDTO');

class UserService {
  
  // Find user by email with role information
  async findUserByEmail(email) {
    console.log(`    🔍 DATABASE: Searching for user with email: ${email}`);
    
    const query = `
      SELECT 
        u.USER_ID, u.ROLE_ID, u.USER_KEY, u.EMAIL, u.USERNAME, u.STATUS, u.CREATED_DATE,
        r.ROLE_NAME
      FROM IMS_USERS_MASTER_TBL u
      LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
      WHERE u.EMAIL = ? AND u.STATUS = 'ACTIVE'
    `;
    
    console.log(`    📝 SQL Query:`, query.replace(/\s+/g, ' ').trim());
    console.log(`    📊 Query params: [${email}]`);
    
    try {
      // First, let's test the connection
      console.log(`    🔗 Testing database connection...`);
      const connection = await pool.getConnection();
      console.log(`    ✅ Connection obtained`);
      
      // Check if database and table exist
      console.log(`    📊 Checking database and table...`);
      const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
      console.log(`    📍 Current database: ${dbResult[0].current_db}`);
      
      const [tableCheck] = await connection.execute('SHOW TABLES LIKE "IMS_USERS_MASTER_TBL"');
      console.log(`    📋 Table exists: ${tableCheck.length > 0}`);
      
      // Check total users in table
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM IMS_USERS_MASTER_TBL');
      console.log(`    👥 Total users in table: ${countResult[0].total}`);
      
      // Check if specific email exists (case-insensitive)
      const [emailCheck] = await connection.execute('SELECT EMAIL, STATUS FROM IMS_USERS_MASTER_TBL WHERE LOWER(EMAIL) = LOWER(?)', [email]);
      console.log(`    📧 Email check results:`, emailCheck);
      
      // Now run the actual query
      const startTime = Date.now();
      const [rows] = await connection.execute(query, [email]);
      const queryTime = Date.now() - startTime;
      
      console.log(`    ⏱️  Query executed in: ${queryTime}ms`);
      console.log(`    📈 Rows returned: ${rows.length}`);
      
      if (rows.length > 0) {
        const user = rows[0];
        console.log(`    ✅ User found:`, {
          USER_ID: user.USER_ID,
          EMAIL: user.EMAIL,
          USERNAME: user.USERNAME,
          ROLE_ID: user.ROLE_ID,
          ROLE_NAME: user.ROLE_NAME,
          STATUS: user.STATUS,
          hasPassword: !!user.USER_KEY,
          passwordLength: user.USER_KEY ? user.USER_KEY.length : 0,
          passwordPreview: user.USER_KEY ? user.USER_KEY.substring(0, 30) + '...' : 'none'
        });
        
        connection.release();
        return user;
      } else {
        console.log(`    ❌ No user found with email: ${email}`);
        
        // Debug: Show all users for comparison
        const [allUsers] = await connection.execute('SELECT EMAIL, STATUS FROM IMS_USERS_MASTER_TBL');
        console.log(`    🔍 All users in database:`, allUsers);
        
        connection.release();
        return null;
      }
    } catch (error) {
      console.log(`    💥 Database error:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        stack: error.stack
      });
      throw new Error('Database error occurred');
    }
  }

  // Test password comparison
  async testPasswordComparison(plainPassword, hashedPassword) {
    console.log(`    🧪 TESTING PASSWORD COMPARISON:`);
    console.log(`      Plain password: "${plainPassword}"`);
    console.log(`      Plain password length: ${plainPassword.length}`);
    console.log(`      Hashed password: ${hashedPassword}`);
    console.log(`      Hash length: ${hashedPassword.length}`);
    console.log(`      Hash format valid: ${hashedPassword.startsWith('$2b$')}`);
    
    try {
      const result = await bcrypt.compare(plainPassword, hashedPassword);
      console.log(`      🔍 Comparison result: ${result}`);
      
      // Also test with a known working hash
      const testHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
      const testResult = await bcrypt.compare('password123', testHash);
      console.log(`      🧪 Known good hash test: ${testResult}`);
      
      return result;
    } catch (error) {
      console.log(`      ❌ Password comparison error:`, error.message);
      throw error;
    }
  }

  // Verify user credentials
  async verifyCredentials(email, password) {
    console.log(`  🔐 VERIFY CREDENTIALS: Starting verification for ${email}`);
    
    try {
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        console.log(`  ❌ User not found: ${email}`);
        return { success: false, message: 'Invalid email or password' };
      }

      console.log(`  🔑 Testing password comparison:`);
      const isPasswordValid = await this.testPasswordComparison(password, user.USER_KEY);
      
      if (!isPasswordValid) {
        console.log(`  ❌ Invalid password for user: ${email}`);
        return { success: false, message: 'Invalid email or password' };
      }

      console.log(`  ✅ Credentials verified successfully for: ${email}`);
      return { success: true, user };
      
    } catch (error) {
      console.log(`  💥 Error in verifyCredentials:`, error.message);
      throw error;
    }
  }

  // Generate JWT token
  generateToken(user) {
    console.log(`  🎫 GENERATE TOKEN: Creating JWT for user ${user.EMAIL}`);
    
    const payload = {
      userId: user.USER_ID,
      email: user.EMAIL,
      roleId: user.ROLE_ID,
      roleName: user.ROLE_NAME
    };

    console.log(`    📦 Token payload:`, payload);
    
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    console.log(`    🔐 JWT config:`, {
      secretLength: secret.length,
      expiresIn: expiresIn
    });

    try {
      const token = jwt.sign(payload, secret, { expiresIn });
      console.log(`    ✅ Token generated successfully`);
      console.log(`    📏 Token length: ${token.length}`);
      return token;
    } catch (error) {
      console.log(`    ❌ Token generation failed:`, error.message);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    console.log(`  👤 GET PROFILE: Fetching profile for user ID: ${userId}`);
    
    const query = `
      SELECT 
        u.USER_ID, u.ROLE_ID, u.EMAIL, u.USERNAME, u.STATUS, u.CREATED_DATE,
        r.ROLE_NAME
      FROM IMS_USERS_MASTER_TBL u
      LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
      WHERE u.USER_ID = ? AND u.STATUS = 'ACTIVE'
    `;
    
    console.log(`    📝 SQL Query: ${query.replace(/\s+/g, ' ').trim()}`);
    console.log(`    📊 Query params: [${userId}]`);
    
    try {
      const startTime = Date.now();
      const [rows] = await pool.execute(query, [userId]);
      const queryTime = Date.now() - startTime;
      
      console.log(`    ⏱️  Query executed in: ${queryTime}ms`);
      console.log(`    📈 Rows returned: ${rows.length}`);
      
      if (rows.length === 0) {
        console.log(`    ❌ User not found with ID: ${userId}`);
        throw new Error('User not found');
      }
      
      const profile = new UserProfileDTO(rows[0]);
      console.log(`    ✅ Profile created:`, profile);
      return profile;
      
    } catch (error) {
      console.log(`    💥 Error getting user profile:`, error.message);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Validate JWT token
  verifyToken(token) {
    console.log(`  🎫 VERIFY TOKEN: Validating JWT token`);
    console.log(`    📏 Token length: ${token.length}`);
    console.log(`    🔍 Token preview: ${token.substring(0, 30)}...`);
    
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      console.log(`    🔐 Using secret length: ${secret.length}`);
      
      const decoded = jwt.verify(token, secret);
      console.log(`    ✅ Token verified successfully`);
      console.log(`    📦 Decoded payload:`, decoded);
      return decoded;
      
    } catch (error) {
      console.log(`    ❌ Token verification failed:`, {
        name: error.name,
        message: error.message
      });
      throw new Error('Invalid or expired token');
    }
  }

  // Get all users (admin functionality)
  async getAllUsers() {
    console.log(`  👥 GET ALL USERS: Fetching all users`);
    
    const query = `
      SELECT 
        u.USER_ID, u.ROLE_ID, u.EMAIL, u.USERNAME, u.STATUS, u.CREATED_DATE,
        r.ROLE_NAME
      FROM IMS_USERS_MASTER_TBL u
      LEFT JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
      ORDER BY u.CREATED_DATE DESC
    `;
    
    try {
      const startTime = Date.now();
      const [rows] = await pool.execute(query);
      const queryTime = Date.now() - startTime;
      
      console.log(`    ⏱️  Query executed in: ${queryTime}ms`);
      console.log(`    📈 Total users found: ${rows.length}`);
      
      const users = rows.map(user => new UserProfileDTO(user));
      console.log(`    ✅ Users mapped to DTOs successfully`);
      return users;
      
    } catch (error) {
      console.log(`    💥 Error getting all users:`, error.message);
      throw new Error('Failed to fetch users');
    }
  }
}

module.exports = new UserService();