const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3001);
const INDEX_HTML = fs.readFileSync(path.join(__dirname, "index.html"));

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a number from 1 to 65535.");
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  if (request.method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/index.html")) {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(INDEX_HTML);
    return;
  }

  response.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end("Not found.");
});

server.on("error", (error) => {
  console.error("Could not start the ticket-booking demo:", error);
  process.exitCode = 1;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Ticket-booking demo available at http://127.0.0.1:${PORT}`);
});
