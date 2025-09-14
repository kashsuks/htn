const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Skip JWT verification if no AUTH0_DOMAIN is configured
  if (!process.env.AUTH0_DOMAIN) {
    console.log('⚠️ Auth0 not configured, skipping token verification');
    req.user = { sub: 'mock-user', email: 'mock@example.com' };
    return next();
  }

  jwt.verify(token, getKey, {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err);
      // For development, allow through with mock user
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using mock user');
        req.user = { sub: 'mock-user', email: 'mock@example.com' };
        return next();
      }
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, getKey, {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decoded;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
};
