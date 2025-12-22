import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());

// Auth middleware
const auth = async (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email, name } });
  } catch (error) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email, name: user.name } });
});

// Calendar routes
app.get('/api/calendars', auth, async (req: any, res) => {
  const calendars = await prisma.calendar.findMany({
    where: {
      OR: [
        { userId: req.userId },
        { shares: { some: { userId: req.userId } } }
      ]
    },
    include: { shares: true }
  });
  res.json(calendars);
});

app.post('/api/calendars', auth, async (req: any, res) => {
  const { name, color } = req.body;
  const calendar = await prisma.calendar.create({
    data: { name, color, userId: req.userId }
  });
  res.json(calendar);
});

app.post('/api/calendars/:id/share', auth, async (req: any, res) => {
  const { email, permission } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const share = await prisma.calendarShare.create({
    data: {
      calendarId: req.params.id,
      userId: user.id,
      permission
    }
  });
  res.json(share);
});

// Event routes
app.get('/api/events', auth, async (req: any, res) => {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { userId: req.userId },
        { calendar: { shares: { some: { userId: req.userId } } } }
      ]
    },
    include: { calendar: true }
  });
  res.json(events);
});

app.post('/api/events', auth, async (req: any, res) => {
  const { title, description, datetime, endDatetime, type, calendarId } = req.body;
  const event = await prisma.event.create({
    data: {
      title, description, datetime, endDatetime, type,
      calendarId, userId: req.userId
    }
  });
  res.json(event);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));