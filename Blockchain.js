const crypto = require('crypto');
const fs = require('fs');

// Block structure for our DigiVault
class Block {
  constructor(index, timestamp, documentHash, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.documentHash = documentHash;  // The hash of the document stored
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  // Hash the block's data along with the nonce
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + this.documentHash + this.nonce)
      .digest('hex');
  }

  // Proof of Work to mine a block
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
    this.chain = [this.createGenesisBlock()];  // First block in the chain
    this.difficulty = 4;  // Difficulty for Proof of Work
  }

  // Create the genesis (first) block
  createGenesisBlock() {
    return new Block(0, '01/01/2024', 'Genesis Block', '0');
  }

  // Get the latest block on the blockchain
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Add a new block containing the hashed document to the chain
  addDocument(documentPath) {
    const documentHash = this.hashDocument(documentPath);
    const newBlock = new Block(this.chain.length, new Date().toLocaleString(), documentHash, this.getLatestBlock().hash);
    
    console.log(`Mining new block for document: ${documentPath}`);
    newBlock.mineBlock(this.difficulty);
    
    this.chain.push(newBlock);
    console.log(`Document stored: ${documentPath} with hash: ${documentHash}`);
  }

  // Hash the document content
  hashDocument(documentPath) {
    const documentContent = fs.readFileSync(documentPath);  // Read file content
    return crypto.createHash('sha256').update(documentContent).digest('hex');
  }

  // Verify the integrity of the entire blockchain
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

// Add documents to the blockchain
myDigiVault.addDocument('document1.txt');
myDigiVault.addDocument('document2.txt');

// Check if the blockchain is valid
console.log('Is blockchain valid?', myDigiVault.isChainValid());

// Output the blockchain
console.log(JSON.stringify(myDigiVault, null, 4));
