import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root (CWD is backend/ when run via workspace)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback: backend/.env
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import reportRouter from './routes/report';
import chatRouter from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/analyze', analyzeRouter);
app.use('/api/report', reportRouter);
app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
