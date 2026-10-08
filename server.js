// load enviroment, app, initialize infrastructure, listen
import 'dotenv/config';
import app from './src/app.js';
import { initializeDatabase } from './src/db/index.js';

const port = process.env.PORT || 3000;

async function startServer() {
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
