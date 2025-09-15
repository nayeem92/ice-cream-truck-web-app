// truck.js
// Usage:
//   node truck.js                        # default connects to localhost:3000
//   SOCKET_URL=http://your.host:3000 node truck.js
//   SOCKET_URL=http://100.127.255.38:8080/proxy/3000/ POLLING_ONLY=1 node truck.js

const { io } = require("socket.io-client");

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3000";
const POLLING_ONLY = !!process.env.POLLING_ONLY; // set to '1' if proxy disallows websockets
const TRUCK_ID = process.env.TRUCK_ID || `truck-${Math.floor(Math.random() * 1000)}`;

const transports = POLLING_ONLY ? ["polling"] : ["websocket", "polling"];

// ✅ Use SOCKET_URL + transports here
const socket = io(SOCKET_URL, {
  path: process.env.SOCKET_PATH || "/socket.io",
  transports,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

let truck = {
  id: TRUCK_ID,
  lat: parseFloat(process.env.START_LAT || "43.7"),
  lng: parseFloat(process.env.START_LNG || "-79.4"),
};

socket.on("connect", () => {
  console.log(
    `✅ [truck] connected to ${SOCKET_URL} as ${TRUCK_ID} (socket id ${socket.id}) transports=${transports.join(",")}`
  );
});

socket.on("connect_error", (err) => {
  console.error("❌ [truck] connect_error:", err && err.message ? err.message : err);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ [truck] disconnected:", reason);
});

// simulate movement: configurable step & interval
const STEP = parseFloat(process.env.STEP || "0.0005");
const INTERVAL = parseInt(process.env.INTERVAL_MS || "2000", 10);

setInterval(() => {
  truck.lat += (Math.random() - 0.5) * STEP;
  truck.lng += (Math.random() - 0.5) * STEP;
  socket.emit("updateLocation", truck);
  console.log("📍 [truck] Sent location:", truck);
}, INTERVAL);
