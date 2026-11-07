// Static server for capture: /cineshelf-showcase/ -> site/, /work/ -> video/work/.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
const ROOT = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const MAP = [["/cineshelf-showcase/", "site"], ["/work/", "video/work"]];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".mp4": "video/mp4" };
createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const m = MAP.find(([p]) => url.startsWith(p));
  if (!m) { res.writeHead(404).end(); return; }
  let rel = normalize(url.slice(m[0].length)).replace(/^([\\/])+/, "");
  if (rel.includes("..")) { res.writeHead(400).end(); return; }
  if (!rel || rel === "." || rel.endsWith("\\") || rel.endsWith("/")) rel = join(rel, "index.html");
  try {
    const body = await readFile(join(ROOT, m[1], rel));
    res.writeHead(200, { "content-type": TYPES[extname(rel)] ?? "application/octet-stream" }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(Number(process.argv[2] ?? 18830), "127.0.0.1");
