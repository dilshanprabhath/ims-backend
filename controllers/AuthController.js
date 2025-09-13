// controllers/AuthController.js
const UserService = require('../services/UserService');
const { LoginRequestDTO, LoginResponseDTO, ErrorResponseDTO } = require('../dto/UserDTO');

class AuthController {

  // Login endpoint
  async login(req, res) {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    console.log('\n' + '='.repeat(80));
    console.log(`🔐 LOGIN ATTEMPT - ${new Date().toISOString()}`);
    console.log(`📍 Client IP: ${clientIP}`);
    console.log(`📨 Request Body:`, {
      email: req.body?.email || 'missing',
      password: req.body?.password ? '[PROVIDED]' : '[MISSING]',
      bodyKeys: Object.keys(req.body || {})
    });
    console.log('='.repeat(80));

    try {
      const { email, password } = req.body;
      
      console.log(`✅ Step 1: Extracting credentials`);
      console.log(`   - Email: ${email || 'undefined'}`);
      console.log(`   - Password: ${password ? '[LENGTH: ' + password.length + ']' : 'undefined'}`);
      
      // Create DTO and validate
      console.log(`🔍 Step 2: Creating and validating DTO`);
      const loginDTO = new LoginRequestDTO(email, password);
      const validation = loginDTO.validate();
      
      console.log(`   - Validation result:`, validation);
      
      if (!validation.isValid) {
        console.log(`❌ Step 2 FAILED: Validation errors:`, validation.errors);
        const errorResponse = new ErrorResponseDTO('Validation failed', validation.errors);
        console.log(`📤 Sending 400 response:`, errorResponse);
        return res.status(400).json(errorResponse);
      }

      console.log(`✅ Step 2: Validation passed`);

      // Verify credentials
      console.log(`🔐 Step 3: Verifying credentials with UserService`);
      const authResult = await UserService.verifyCredentials(email, password);
      
      console.log(`   - Auth result:`, {
        success: authResult.success,
        message: authResult.message,
        hasUser: !!authResult.user,
        userEmail: authResult.user?.EMAIL || 'none'
      });
      
      if (!authResult.success) {
        console.log(`❌ Step 3 FAILED: ${authResult.message}`);
        const errorResponse = new ErrorResponseDTO(authResult.message);
        console.log(`📤 Sending 401 response:`, errorResponse);
        return res.status(401).json(errorResponse);
      }

      console.log(`✅ Step 3: Credentials verified successfully`);
      console.log(`   - User found:`, {
        id: authResult.user.USER_ID,
        email: authResult.user.EMAIL,
        username: authResult.user.USERNAME,
        role: authResult.user.ROLE_NAME
      });

      // Generate token
      console.log(`🎫 Step 4: Generating JWT token`);
      const token = UserService.generateToken(authResult.user);
      console.log(`   - Token generated: ${token ? '[SUCCESS]' : '[FAILED]'}`);
      console.log(`   - Token preview: ${token ? token.substring(0, 50) + '...' : 'none'}`);
      
      // Return success response
      console.log(`📦 Step 5: Creating success response`);
      const response = new LoginResponseDTO(authResult.user, token);
      console.log(`   - Response created:`, {
        success: response.success,
        hasToken: !!response.data?.token,
        userInfo: response.data?.user
      });

      const executionTime = Date.now() - startTime;
      console.log(`✅ LOGIN SUCCESS - Total time: ${executionTime}ms`);
      console.log(`📤 Sending 200 response to client`);
      console.log('='.repeat(80) + '\n');
      
      return res.status(200).json(response);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.log(`💥 FATAL ERROR in login process:`);
      console.log(`   - Error name: ${error.name}`);
      console.log(`   - Error message: ${error.message}`);
      console.log(`   - Error stack:`, error.stack);
      console.log(`   - Execution time: ${executionTime}ms`);
      
      const errorResponse = new ErrorResponseDTO('Internal server error');
      console.log(`📤 Sending 500 response:`, errorResponse);
      console.log('='.repeat(80) + '\n');
      
      return res.status(500).json(errorResponse);
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    console.log('\n' + '-'.repeat(60));
    console.log(`👤 GET PROFILE REQUEST - ${new Date().toISOString()}`);
    console.log(`📍 User from token:`, req.user);
    
    try {
      const userId = req.user.userId;
      console.log(`🔍 Fetching profile for user ID: ${userId}`);
      
      const userProfile = await UserService.getUserProfile(userId);
      console.log(`✅ Profile retrieved:`, userProfile);
      
      const response = {
        success: true,
        message: 'Profile retrieved successfully',
        data: userProfile
      };
      
      console.log(`📤 Sending profile response`);
      console.log('-'.repeat(60) + '\n');
      
      return res.status(200).json(response);

    } catch (error) {
      console.log(`❌ Profile fetch error:`, error.message);
      console.log('-'.repeat(60) + '\n');
      
      return res.status(500).json(new ErrorResponseDTO('Failed to retrieve profile'));
    }
  }

  // Logout endpoint (client-side token removal)
  async logout(req, res) {
    console.log('\n' + '-'.repeat(40));
    console.log(`🚪 LOGOUT REQUEST - ${new Date().toISOString()}`);
    console.log(`👤 User:`, req.user?.email || 'unknown');
    
    const response = {
      success: true,
      message: 'Logged out successfully'
    };
    
    console.log(`✅ Logout successful`);
    console.log('-'.repeat(40) + '\n');
    
    return res.status(200).json(response);
  }

  // Verify token endpoint
  async verifyToken(req, res) {
    console.log('\n' + '-'.repeat(50));
    console.log(`🎫 VERIFY TOKEN REQUEST - ${new Date().toISOString()}`);
    
    try {
      const authHeader = req.headers.authorization;
      console.log(`🔍 Auth header present: ${!!authHeader}`);
      console.log(`🔍 Auth header format: ${authHeader ? authHeader.substring(0, 20) + '...' : 'none'}`);
      
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        console.log(`❌ No token provided`);
        console.log('-'.repeat(50) + '\n');
        return res.status(401).json(new ErrorResponseDTO('No token provided'));
      }

      console.log(`🔐 Verifying token: ${token.substring(0, 30)}...`);
      const decoded = UserService.verifyToken(token);
      console.log(`✅ Token decoded:`, decoded);
      
      console.log(`👤 Fetching user profile for: ${decoded.userId}`);
      const userProfile = await UserService.getUserProfile(decoded.userId);
      console.log(`✅ User profile retrieved:`, userProfile);
      
      const response = {
        success: true,
        message: 'Token is valid',
        data: {
          user: userProfile,
          tokenData: decoded
        }
      };
      
      console.log(`✅ Token verification successful`);
      console.log('-'.repeat(50) + '\n');
      
      return res.status(200).json(response);

    } catch (error) {
      console.log(`❌ Token verification failed:`, error.message);
      console.log('-'.repeat(50) + '\n');
      
      return res.status(401).json(new ErrorResponseDTO('Invalid token'));
    }
  }
}

module.exports = new AuthController();