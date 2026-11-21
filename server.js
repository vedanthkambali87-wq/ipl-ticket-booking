const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3001);
const ROUTES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/booking", "booking.html"],
  ["/booking.html", "booking.html"],
  ["/history", "history.html"],
  ["/history.html", "history.html"],
  ["/styles.css", "styles.css"],
  ["/app.js", "app.js"]
]);
const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"]
]);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a number from 1 to 65535.");
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  if (request.method !== "GET") {
    response.writeHead(405, {
      "Allow": "GET",
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    });
    response.end("Method not allowed.");
    return;
  }

  const fileName = ROUTES.get(requestUrl.pathname);
  if (!fileName) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    });
    response.end("Not found.");
    return;
  }

  let content;
  try {
    content = fs.readFileSync(path.join(__dirname, fileName));
  } catch (error) {
    console.error(`Could not read ${fileName}:`, error);
    response.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    });
    response.end("The requested page could not be served.");
    return;
  }

  response.writeHead(200, {
    "Content-Type": CONTENT_TYPES.get(path.extname(fileName)),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(content);
});

server.on("error", (error) => {
  console.error("Could not start the IPL matchday demo:", error);
  process.exitCode = 1;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`IPL matchday demo available at http://127.0.0.1:${PORT}`);
});
