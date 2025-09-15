// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = process.env.PUBLIC_DIR || "public";

const app = express();

// Serve static frontend from public/
app.use(express.static(PUBLIC_DIR));

// simple health endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// allow CORS (tighten in prod with process.env.CORS_ORIGIN)
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  },
  // explicitly support both transports (websocket first, polling fallback)
  transports: (process.env.SOCKET_TRANSPORTS ? process.env.SOCKET_TRANSPORTS.split(",") : ["websocket","polling"]),
  path: process.env.SOCKET_PATH || "/socket.io"
});

// In-memory truck storage (simple). For prod replace with DB.
let trucks = [];

// Helper to upsert truck
function upsertTruck(truck) {
  const idx = trucks.findIndex(t => t.id === truck.id);
  if (idx >= 0) trucks[idx] = truck;
  else trucks.push(truck);
}

io.on("connection", (socket) => {
  console.log(`[io] client connected: ${socket.id} (handshake: host=${socket.handshake.headers.host})`);

  // send current trucks immediately
  socket.emit("trucks", trucks);

  socket.on("updateLocation", (truck) => {
    if (!truck || !truck.id) return;
    upsertTruck(truck);
    // broadcast latest list
    io.emit("trucks", trucks);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[io] client disconnected: ${socket.id} (${reason})`);
    // keep trucks history; consider removing stale trucks if you want
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}  (PUBLIC_DIR=${PUBLIC_DIR})`);
});
