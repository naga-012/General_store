const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'kirana_secret_jwt_token_super_secure_key_2026',
    {
      expiresIn: '30d',
    }
  );
};

module.exports = generateToken;
