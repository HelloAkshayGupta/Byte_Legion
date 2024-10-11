const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secretKey = process.env.JWT_SECRET || 'fallbackSecret';
const saltRounds = 10;

// In-memory user store (hash the passwords before use)
const users = {
  admin: {
    username: 'admin',
    password: bcrypt.hashSync('password123', saltRounds), // Hash password
    role: 'admin',
  },
  user: {
    username: 'user',
    password: bcrypt.hashSync('123', saltRounds),
    role: 'user',
  },
};

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).send('Token required');

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
}

// Check role middleware
function checkRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).send('Access denied');
    }
    next();
  };
}

// Login function
function login(req, res) {
  const { username, password } = req.body;
  const user = Object.values(users).find(u => u.username === username);

  if (!user) {
    return res.status(403).send('Invalid username or password');
  }

  // Compare hashed password
  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      const token = jwt.sign({ username: user.username, role: user.role }, secretKey, { expiresIn: '1h' });
      return res.json({ token });
    } else {
      return res.status(403).send('Invalid username or password');
    }
  });
}

module.exports = { authenticateToken, checkRole, login };
