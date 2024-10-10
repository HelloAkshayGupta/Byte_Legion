const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const secretKey = 'mySuperSecretKey';  // Secret key for JWT (use a strong secret in production)

// In-memory users for demo purposes (in a real app, you'd use a database)
const users = {
  admin: {
    username: 'admin',
    password: 'password123',  // In production, store hashed passwords
    role: 'admin'
  },
  user: {
    username: 'user',
    password: '123',
    role: 'user'
  }
};

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 'Bearer <token>'

  if (token == null) return res.status(401).send('Token required');

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user; // Add user information to request
    next(); // Proceed to the next middleware or route
  });
}

// Block structure for our DigiVault
class Block {
  constructor(index, timestamp, documentHash, documentPath, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.documentHash = documentHash;  // The hash of the document stored
    this.documentPath = documentPath;  // The path where the document is stored
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + this.documentHash + this.nonce)
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0'); // e.g., '0000' for difficulty 4
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash} (Nonce: ${this.nonce})`);
  }
}

// Blockchain structure for storing documents
class DigiVaultBlockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
  }

  createGenesisBlock() {
    return new Block(0, '01/01/2024', 'Genesis Block', '', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addDocument(documentPath) {
    const documentHash = this.hashDocument(documentPath);
    const newBlock = new Block(this.chain.length, new Date().toLocaleString(), documentHash, documentPath, this.getLatestBlock().hash);
    
    console.log(`Mining new block for document: ${documentPath}`);
    newBlock.mineBlock(this.difficulty);
    
    this.chain.push(newBlock);
    console.log(`Document stored: ${documentPath} with hash: ${documentHash}`);
  }

  hashDocument(documentPath) {
    const documentContent = fs.readFileSync(documentPath);
    return crypto.createHash('sha256').update(documentContent).digest('hex');
  }

  getDocumentByHash(documentHash) {
    const block = this.chain.find(block => block.documentHash === documentHash);
    if (block) {
      return block.documentPath;
    }
    return null;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

// Create a new instance of DigiVault
const myDigiVault = new DigiVaultBlockchain();

// JWT Login Route (returns a token)
app.post('/login', express.json(), (req, res) => {
  const { username, password } = req.body;

  // Basic authentication (in a real app, use a database and hash passwords)
  const user = Object.values(users).find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(403).send('Invalid username or password');
  }

  // Create and return a JWT token
  const token = jwt.sign({ username: user.username, role: user.role }, secretKey, { expiresIn: '1h' });
  res.json({ token });
});

// Route to add a document to the blockchain (protected)
app.post('/addDocument', authenticateToken, express.json(), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Only admin can add documents');
  }

  const { documentPath } = req.body;

  if (!documentPath || !fs.existsSync(documentPath)) {
    return res.status(400).send('Document does not exist');
  }

  myDigiVault.addDocument(documentPath);
  res.send('Document added successfully');
});

// Route to retrieve a document by its hash (protected)
app.get('/document/:hash', authenticateToken, (req, res) => {
  const documentHash = req.params.hash;

  const documentPath = myDigiVault.getDocumentByHash(documentHash);

  if (documentPath) {
    res.sendFile(path.resolve(documentPath), err => {
      if (err) {
        res.status(500).send('Error serving the document.');
      }
    });
  } else {
    res.status(404).send('Document not found.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`DigiVault is running on http://localhost:${PORT}`);
});
