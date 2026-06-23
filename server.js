import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Read and parse .env file
function readEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key === 'SUPABASE_URL') env.SUPABASE_URL = value;
        if (key === 'SUPABASE_ANON_KEY') env.SUPABASE_ANON_KEY = value;
      }
    });
  }
  return env;
}

const server = http.createServer((req, res) => {
  const env = readEnv();
  
  // Serve the env script dynamically
  if (req.url === '/env.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(`window.__ENV__ = ${JSON.stringify(env)};`);
    return;
  }
  
  // Clean requested path to prevent directory traversal
  let safeUrl = req.url.split('?')[0];
  let filePath = path.join(__dirname, safeUrl === '/' ? 'index.html' : safeUrl);
  
  // Simple MIME types map
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Using Supabase URL: ${readEnv().SUPABASE_URL || 'Not set'}`);
});
