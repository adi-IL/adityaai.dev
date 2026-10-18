import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { handleSubscribe, handleSubscribeConfirm } from './lib/handlers/subscribe.js';
import { handleFeedback } from './lib/handlers/feedback.js';
import { handleVirtualCoffee } from './lib/handlers/virtual-coffee.js';
import { handleC2hReport } from './lib/handlers/c2h-report.js';
import { handleChat } from './lib/handlers/chat.js';
import { projects } from './src/lib/projects.js';

dotenv.config({ path: ['.env.local', '.env'] });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(
    helmet({
      contentSecurityPolicy: false, // managed via vercel.json in production
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });

  app.use('/api/', apiLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/subscribe', (req, res) => {
    void handleSubscribe(req, res);
  });

  app.get('/api/subscribe/confirm', (req, res) => {
    void handleSubscribeConfirm(req, res);
  });

  app.post('/api/virtual-coffee', (req, res) => {
    void handleVirtualCoffee(req, res);
  });

  app.post('/api/feedback', (req, res) => {
    void handleFeedback(req, res);
  });

  app.post('/api/c2h-report', (req, res) => {
    void handleC2hReport(req, res);
  });

  app.post('/api/chat', (req, res) => {
    void handleChat(req, res);
  });

  // Match vercel.json permanent redirects and hard 404s on unknown article/project slugs.
  app.get(['/essays', '/essays/'], (_req, res) => {
    res.redirect(308, '/articles');
  });
  app.get(['/projects/opalserve', '/projects/opalserve/'], (_req, res) => {
    res.redirect(308, '/projects');
  });
  app.get(
    ['/articles/44_arc_agi_3_failure_architecture', '/articles/44_arc_agi_3_failure_architecture/'],
    (_req, res) => {
      res.redirect(308, '/articles/the-verification-gap');
    },
  );
  app.get('/articles/:slug', (req, res, next) => {
    try {
      const meta = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'scripts', 'articles-meta.json'), 'utf8'),
      ) as Array<{ slug: string }>;
      if (!meta.some((a) => a.slug === req.params.slug)) {
        res.status(404).sendFile(path.join(process.cwd(), 'public', '404.html'));
        return;
      }
    } catch {
      // Fall through if articles-meta.json is unavailable.
    }
    next();
  });
  app.get('/projects/:slug', (req, res, next) => {
    if (!projects.some((p) => p.slug === req.params.slug)) {
      res.status(404).sendFile(path.join(process.cwd(), 'public', '404.html'));
      return;
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

void startServer();
