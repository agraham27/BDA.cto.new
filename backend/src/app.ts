import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from '@/routes';
import { ENV } from '@/config/env';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ENV.corsOrigins.includes('*')) {
        return callback(null, true);
      }

      if (ENV.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(morgan(ENV.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Hoc Vien Big Dipper API',
    version: '1.0.0',
  });
});

app.use(routes);

export default app;
