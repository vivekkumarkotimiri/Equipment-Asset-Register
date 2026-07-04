/* ================================================================
   SERVER
   - Serves the frontend (the asset-register web page) as static files.
   - Exposes a small REST API backed by SQLite (see db.js).
   - Anyone can GET records (public, read-only).
   - Only a logged-in admin (valid token from POST /api/login) can
     POST a new record or DELETE one.

   Run with:  npm install   then   npm start
   Then open http://<this-computer's-IP>:3000 from any device on
   the same network.
   ================================================================ */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const rateLimit = require("express-rate-limit");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3030;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "12h";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Trust the reverse proxy (Caddy/nginx) so rate limiting and logging
// see the real visitor IP instead of 127.0.0.1.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// Limits login attempts once this server is reachable from the internet,
// to slow down anyone trying to guess the admin password.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 attempts per IP per window
  message: { error: "Too many login attempts. Try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

/* ----------------------------------------------------------------
   AUTH MIDDLEWARE
   Checks for a valid "Authorization: Bearer <token>" header.
   Only routes that need admin rights use this.
   ---------------------------------------------------------------- */
function requireAdmin(req, res, next){
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if(!token){
    return res.status(401).json({ error: "Login required." });
  }
  try{
    jwt.verify(token, JWT_SECRET);
    next();
  }catch(e){
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}

/* ----------------------------------------------------------------
   POST /api/login
   Body: { username, password }
   Returns: { token } on success, 401 on failure.
   ---------------------------------------------------------------- */
app.post("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if(username === ADMIN_USERNAME && password === ADMIN_PASSWORD){
    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.json({ token });
  }
  return res.status(401).json({ error: "Incorrect username or password." });
});

/* ----------------------------------------------------------------
   GET /api/records
   Public — anyone can view the full record set. The frontend
   handles date-range filtering and export client-side.
   ---------------------------------------------------------------- */
app.get("/api/records", (req, res) => {
  const records = db.getAllRecords();
  res.json({ records });
});

/* ----------------------------------------------------------------
   POST /api/records
   Admin only — creates a new equipment record.
   ---------------------------------------------------------------- */
app.post("/api/records", requireAdmin, (req, res) => {
  const { date, deptName, officerName, keyboards, mouse, other } = req.body || {};

  if(!deptName || !deptName.trim() || !officerName || !officerName.trim()){
    return res.status(400).json({ error: "Department name and name of officer are required." });
  }

  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    date: date || new Date().toISOString().slice(0, 10),
    deptName: deptName.trim(),
    officerName: officerName.trim(),
    keyboards: Number(keyboards) || 0,
    mouse: Number(mouse) || 0,
    other: (other || "").trim(),
    createdAt: new Date().toISOString()
  };

  const saved = db.addRecord(record);
  res.status(201).json({ record: saved });
});

/* ----------------------------------------------------------------
   DELETE /api/records/:id
   Admin only — not currently used by the UI (no actions column),
   kept available for direct use if you need to remove a record.
   ---------------------------------------------------------------- */
app.delete("/api/records/:id", requireAdmin, (req, res) => {
  const removed = db.deleteRecord(req.params.id);
  if(!removed) return res.status(404).json({ error: "Record not found." });
  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Asset Register server running.`);
  console.log(`On this computer:        http://localhost:${PORT}`);
  console.log(`From other devices on the same network: http://<this-computer's-IP>:${PORT}`);
});
