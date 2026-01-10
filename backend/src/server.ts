import express from 'express';
import cors from 'cors';
import { dbService } from './database';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Chronio Backend API' });
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await dbService.getDb().collection('users').find({}).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const result = await dbService.getDb().collection('users').insertOne(req.body);
    res.json({ id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

async function startServer() {
  try {
    await dbService.connect();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    process.on('SIGINT', async () => {
      console.log('Closing server...');
      await dbService.close();
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();