import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3001);
const types = { ".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8" };

createServer(async (req,res)=>{
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  const requested = pathname === "/" ? "/index.html" : pathname;
  const file = normalize(join(root, requested));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end("Forbidden"); }
  try {
    const body = await readFile(file);
    res.writeHead(200, {"Content-Type": types[extname(file)] || "application/octet-stream","Cache-Control":"no-store"});
    res.end(body);
  } catch {
    res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"});
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", ()=>console.log("SkulGo Teacher running at http://localhost:"+port));
