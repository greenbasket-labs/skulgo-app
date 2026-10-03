import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3000);
const dataDir = join(root, "data");
const studentsFile = join(dataDir, "students.json");

async function ensureStudentStore() {
  await mkdir(dataDir, { recursive: true });
  try { await readFile(studentsFile, "utf8"); }
  catch { await writeFile(studentsFile, JSON.stringify({ admissions: [], students: [] }, null, 2)); }
}

async function readStudentStore() {
  await ensureStudentStore();
  try {
    const parsed = JSON.parse(await readFile(studentsFile, "utf8"));
    return {
      admissions: Array.isArray(parsed.admissions) ? parsed.admissions : [],
      students: Array.isArray(parsed.students) ? parsed.students : []
    };
  } catch {
    return { admissions: [], students: [] };
  }
}

async function saveStudentStore(store) {
  await ensureStudentStore();
  const next = {
    admissions: Array.isArray(store?.admissions) ? store.admissions : [],
    students: Array.isArray(store?.students) ? store.students : []
  };
  await writeFile(studentsFile, JSON.stringify(next, null, 2));
  return next;
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;

  if (pathname === "/api/students") {
    try {
      if (req.method === "GET") {
        const store = await readStudentStore();
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        res.end(JSON.stringify(store));
        return;
      }

      if (req.method === "POST") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const store = await saveStudentStore(JSON.parse(body || "{}"));
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        res.end(JSON.stringify(store));
        return;
      }
    } catch (error) {
      res.writeHead(400, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(JSON.stringify({ error: error?.message || "Student storage error" }));
      return;
    }

    res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
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
