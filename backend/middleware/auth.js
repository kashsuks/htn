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

  // Handle RBC API tokens (JWT tokens that start with 'eyJ')
  if (token.startsWith('eyJ')) {
    try {
      // Decode RBC token without verification (since we don't have RBC's signing key)
      const decoded = jwt.decode(token);
      
      if (decoded) {
        // Validate token structure and expiration
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          console.log('❌ RBC token expired');
          return res.status(401).json({ error: 'Token expired' });
        }
        
        if (!decoded.teamId && !decoded.sub) {
          console.log('❌ RBC token missing teamId');
          return res.status(401).json({ error: 'Invalid token structure' });
        }
        
        console.log('🔑 RBC API token validated, using team-based auth');
        req.user = { 
          sub: decoded.teamId || decoded.sub, 
          email: decoded.contact_email || decoded.email || 'rbc@api.com',
          teamId: decoded.teamId || decoded.sub,
          team_name: decoded.team_name || 'RBC API User',
          exp: decoded.exp,
          iat: decoded.iat
        };
        return next();
      }
    } catch (err) {
      console.warn('Failed to decode RBC token:', err.message);
    }
    
    // If RBC token decoding fails, return 401
    console.log('❌ Invalid RBC token');
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Skip JWT verification if no AUTH0_DOMAIN is configured
  if (!process.env.AUTH0_DOMAIN) {
    console.log('⚠️ Auth0 not configured, skipping token verification');
    req.user = { sub: 'mock-user', email: 'mock@example.com' };
    return next();
  }

  // Try Auth0 verification for non-RBC tokens
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

  // Handle RBC API tokens (JWT tokens that start with 'eyJ')
  if (token.startsWith('eyJ')) {
    try {
      // Decode RBC token without verification
      const decoded = jwt.decode(token);
      
      if (decoded) {
        // Validate token structure and expiration
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          console.log('❌ RBC token expired in optional auth');
          req.user = null;
          return next();
        }
        
        if (!decoded.teamId && !decoded.sub) {
          console.log('❌ RBC token missing teamId in optional auth');
          req.user = null;
          return next();
        }
        
        console.log('🔑 RBC API token validated in optional auth');
        req.user = { 
          sub: decoded.teamId || decoded.sub, 
          email: decoded.contact_email || decoded.email || 'rbc@api.com',
          teamId: decoded.teamId || decoded.sub,
          team_name: decoded.team_name || 'RBC API User',
          exp: decoded.exp,
          iat: decoded.iat
        };
        return next();
      }
    } catch (err) {
      console.warn('Failed to decode RBC token in optional auth:', err.message);
    }
    
    // If RBC token decoding fails, set user to null
    console.log('❌ Invalid RBC token in optional auth');
    req.user = null;
    return next();
  }

  // Try Auth0 verification for non-RBC tokens
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
