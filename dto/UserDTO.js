// Login Request DTO
class LoginRequestDTO {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  validate() {
    const errors = [];
    
    if (!this.email || !this.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }
    
    if (!this.password || !this.password.trim()) {
      errors.push('Password is required');
    } else if (this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Login Response DTO
class LoginResponseDTO {
  constructor(user, token) {
    this.success = true;
    this.message = 'Login successful';
    this.data = {
      user: {
        userId: user.USER_ID,
        email: user.EMAIL,
        username: user.USERNAME,
        roleId: user.ROLE_ID,
        roleName: user.ROLE_NAME
      },
      token: token
    };
  }
}

// Error Response DTO
class ErrorResponseDTO {
  constructor(message, errors = []) {
    this.success = false;
    this.message = message;
    this.errors = errors;
  }
}

// User Profile DTO
class UserProfileDTO {
  constructor(user) {
    this.userId = user.USER_ID;
    this.email = user.EMAIL;
    this.username = user.USERNAME;
    this.roleId = user.ROLE_ID;
    this.roleName = user.ROLE_NAME;
    this.status = user.STATUS;
    this.createdDate = user.CREATED_DATE;
  }
}

module.exports = {
  LoginRequestDTO,
  LoginResponseDTO,
  ErrorResponseDTO,
  UserProfileDTO
};