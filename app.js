const express = require('express');
const routes = require('./routes');
require('dotenv').config(); // Use dotenv to load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(routes);

app.listen(PORT, () => {
  console.log(`DigiVault is running on http://localhost:${PORT}`);
});
