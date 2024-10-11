const express = require('express');
const { authenticateToken, checkRole, login } = require('./auth');
const DigiVaultBlockchain = require('./Blockchain');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Create a new instance of DigiVault
const myDigiVault = new DigiVaultBlockchain();

// JWT Login Route
router.post('/login', express.json(), login);

// Route to add a document to the blockchain (protected)
router.post('/addDocument', authenticateToken, checkRole('admin'), express.json(), async (req, res) => {
  const { documentPath } = req.body;

  if (!documentPath || !fs.existsSync(documentPath)) {
    return res.status(400).send('Document does not exist');
  }

  await myDigiVault.addDocument(documentPath);
  res.send('Document added successfully');
});

// Route to retrieve a document by its hash (protected)
router.get('/document/:hash', authenticateToken, async (req, res) => {
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



router.get('/chain/isValid', (req, res) => {
    const isValid = myDigiVault.isChainValid();
    res.json({ isValid });
  });
  

module.exports = router;
