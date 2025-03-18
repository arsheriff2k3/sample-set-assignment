import express, { Application } from 'express';
import dotenv from 'dotenv';
import InstagramController from './controllers/instagram.controller';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const instagramController = new InstagramController();

app.get('/api/instagram/latest', instagramController.getLatestPost);
app.post('/api/instagram/username', instagramController.updateUsername);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;