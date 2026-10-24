import app from '../server/app.js';
import { dbService } from '../server/db.js';

export default async function handler(req: any, res: any) {
  // Await Supabase authoritative database hydration before handling any serverless request
  try {
    await dbService.ensureReady();
  } catch (err: any) {
    console.error('[Vercel Handler Readiness Error]:', err?.message || err);
  }

  // Normalize request URLs so that on Vercel Serverless Functions, requests without /api prefix,
  // rewritten to /api/index, or with ?0= rewrite parameters match the Express /api routes properly
  const originalUrl = req.headers?.['x-matched-path'] || req.headers?.['x-forwarded-uri'] || req.headers?.['x-original-url'];
  if (originalUrl && typeof originalUrl === 'string' && originalUrl.startsWith('/api') && originalUrl !== '/api' && originalUrl !== '/api/index') {
    req.url = originalUrl;
  } else if (req.url) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const param0 = urlObj.searchParams.get('0') || urlObj.searchParams.get('path');
      if (param0) {
        urlObj.searchParams.delete('0');
        urlObj.searchParams.delete('path');
        const remainingQuery = urlObj.searchParams.toString();
        req.url = '/api/' + param0.replace(/^\/+/, '') + (remainingQuery ? '?' + remainingQuery : '');
      } else if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      }
    } catch {
      if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      }
    }
  }

  return app(req, res);
}
