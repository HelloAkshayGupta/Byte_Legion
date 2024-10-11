const crypto = require('crypto');
const fs = require('fs');

class Block {
  constructor(index, timestamp, documentHash, documentPath, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.documentHash = documentHash;
    this.documentPath = documentPath;
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
    const target = Array(difficulty + 1).join('0');
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash} (Nonce: ${this.nonce})`);
  }
}

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

  async addDocument(documentPath) {
    const documentHash = await this.hashDocument(documentPath);
    const newBlock = new Block(this.chain.length, new Date().toLocaleString(), documentHash, documentPath, this.getLatestBlock().hash);
    
    console.log(`Mining new block for document: ${documentPath}`);
    newBlock.mineBlock(this.difficulty);
    
    this.chain.push(newBlock);
    console.log(`Document stored: ${documentPath} with hash: ${documentHash}`);
  }

  async hashDocument(documentPath) {
    return new Promise((resolve, reject) => {
      fs.readFile(documentPath, (err, data) => {
        if (err) return reject(err);
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        resolve(hash);
      });
    });
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

module.exports = DigiVaultBlockchain;
