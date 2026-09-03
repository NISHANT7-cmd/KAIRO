import app from '../server/app.js';

export default function handler(req: any, res: any) {
  // Normalize request URLs so that on Vercel Serverless Functions, requests without /api prefix
  // or with ?0= rewrite parameters match the Express /api routes properly
  if (req.url && !req.url.startsWith('/api')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const param0 = urlObj.searchParams.get('0');
      if (param0) {
        urlObj.searchParams.delete('0');
        const remainingQuery = urlObj.searchParams.toString();
        req.url = '/api/' + param0.replace(/^\/+/, '') + (remainingQuery ? '?' + remainingQuery : '');
      } else {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      }
    } catch {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }

  return app(req, res);
}
