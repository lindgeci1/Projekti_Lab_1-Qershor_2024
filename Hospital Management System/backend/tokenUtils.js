const crypto = require('crypto');

const generateRandomToken = () => {
  const secretKey = crypto.randomBytes(64).toString('hex');
  return {
    secret: secretKey,
    algorithm: 'HS256'
  };
};

module.exports = generateRandomToken;
