import { cpSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const out = resolve(root, ".vercel/output");

mkdirSync(`${out}/static`, { recursive: true });
mkdirSync(`${out}/functions/ssr.func`, { recursive: true });

// Static assets → .vercel/output/static/
cpSync(`${root}/dist/client`, `${out}/static`, { recursive: true });

// Node.js wrapper that adapts the fetch handler for Vercel
writeFileSync(
  `${out}/functions/ssr.func/index.js`,
  `
let _server;
async function getServer() {
  if (!_server) {
    const m = await import('./server.js');
    _server = m.default;
  }
  return _server;
}

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = \`\${proto}://\${host}\${req.url}\`;

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  }

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise(resolve => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  const request = new Request(url, { method: req.method, headers, body });
  const server = await getServer();
  const response = await server.fetch(request, {}, {});

  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  const buf = await response.arrayBuffer();
  res.end(Buffer.from(buf));
}
`.trim()
);

// Copy the server bundle + assets into the function dir
cpSync(`${root}/dist/server/server.js`, `${out}/functions/ssr.func/server.js`);
cpSync(`${root}/dist/server/assets`, `${out}/functions/ssr.func/assets`, { recursive: true });

// Function config
writeFileSync(
  `${out}/functions/ssr.func/.vc-config.json`,
  JSON.stringify({ runtime: "nodejs20.x", handler: "index.js", launcherType: "Nodejs" }, null, 2)
);

// Routing: static files first, then SSR for everything else
writeFileSync(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/ssr" },
      ],
    },
    null,
    2
  )
);

console.log("✓ .vercel/output gerado com sucesso");
