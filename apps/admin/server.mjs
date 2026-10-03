import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  const file = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const path = join(root, file);

  try {
    const content = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`SkulGo Admin App Shell running at http://localhost:${port}`);
  console.log("Offline-first shell: no external services required.");
});
