import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
createServer(async (req, res) => {
  const requested = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const file = normalize(join(root, requested));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body); }
  catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Quantum Lens running at http://127.0.0.1:4173'));
