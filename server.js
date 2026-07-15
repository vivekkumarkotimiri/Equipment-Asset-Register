/* ================================================================
   SERVER
   ================================================================ */
require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const jwt       = require("jsonwebtoken");
const path      = require("path");
const rateLimit = require("express-rate-limit");
const db        = require("./db");

const app  = express();
const PORT             = process.env.PORT             || 3030;
const JWT_SECRET       = process.env.JWT_SECRET       || "dev-secret-change-me";
const TOKEN_EXPIRY     = process.env.TOKEN_EXPIRY     || "12h";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const USER_USERNAME  = process.env.USER_USERNAME  || "user";
const USER_PASSWORD  = process.env.USER_PASSWORD  || "user123";

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: "Too many login attempts. Try again later." },
  standardHeaders: true, legacyHeaders: false
});

// Verifies token and attaches decoded payload to req.user
function verifyToken(req, res){
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if(!token){ res.status(401).json({ error: "Login required." }); return null; }
  try{ return jwt.verify(token, JWT_SECRET); }
  catch(e){ res.status(401).json({ error: "Session expired. Please log in again." }); return null; }
}

// Admin OR user — can add/delete issue records
function requireMember(req, res, next){
  const decoded = verifyToken(req, res);
  if(!decoded) return;
  if(decoded.role !== "admin" && decoded.role !== "user")
    return res.status(403).json({ error: "Access denied." });
  req.user = decoded;
  next();
}

// Admin only — stock entry management
function requireAdmin(req, res, next){
  const decoded = verifyToken(req, res);
  if(!decoded) return;
  if(decoded.role !== "admin")
    return res.status(403).json({ error: "Admin access required." });
  req.user = decoded;
  next();
}

/* --- Login --- */
app.post("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if(username === ADMIN_USERNAME && password === ADMIN_PASSWORD){
    const token = jwt.sign({ role:"admin", username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.json({ token, role: "admin" });
  }
  if(username === USER_USERNAME && password === USER_PASSWORD){
    const token = jwt.sign({ role:"user", username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.json({ token, role: "user" });
  }
  res.status(401).json({ error: "Incorrect username or password." });
});

/* --- Issue Records --- */
app.get("/api/records", (_req, res) => {
  res.json({ records: db.getAllRecords() });
});

app.post("/api/records", requireMember, (req, res) => {
  const { date, deptName, officerName, roomno, extension, material, quantity } = req.body || {};
  if(!deptName?.trim() || !officerName?.trim() || !material?.trim())
    return res.status(400).json({ error: "Department, officer and material are required." });

  const qty     = Number(quantity) || 0;
  const balance = db.getBalance(material) - qty;

  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,7),
    date: date || new Date().toISOString().slice(0,10),
    deptName: deptName.trim(), officerName: officerName.trim(),
    roomno: (roomno||"").trim(), extension: (extension||"").trim(),
    material: material.trim(), quantity: qty, balance,
    createdAt: new Date().toISOString()
  };
  res.status(201).json({ record: db.addRecord(record) });
});

app.delete("/api/records/:id", requireMember, (req, res) => {
  const removed = db.deleteRecord(req.params.id);
  if(!removed) return res.status(404).json({ error: "Record not found." });
  res.json({ success: true });
});

/* --- Stock Entries --- */
app.get("/api/stock", (_req, res) => {
  res.json({ stock: db.getAllStock() });
});

app.post("/api/stock", requireAdmin, (req, res) => {
  const { date, material, quantity } = req.body || {};
  if(!material?.trim()) return res.status(400).json({ error: "Material is required." });
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,7),
    date: date || new Date().toISOString().slice(0,10),
    material: material.trim(),
    quantity: Number(quantity) || 0,
    createdAt: new Date().toISOString()
  };
  res.status(201).json({ entry: db.addStock(entry) });
});

app.put("/api/stock/:id", requireAdmin, (req, res) => {
  const { date, material, quantity } = req.body || {};
  const updated = db.updateStock({
    id: req.params.id,
    date: date || new Date().toISOString().slice(0,10),
    material: (material||"").trim(),
    quantity: Number(quantity) || 0
  });
  if(!updated) return res.status(404).json({ error: "Stock entry not found." });
  res.json({ entry: updated });
});

app.delete("/api/stock/:id", requireAdmin, (req, res) => {
  const removed = db.deleteStock(req.params.id);
  if(!removed) return res.status(404).json({ error: "Stock entry not found." });
  res.json({ success: true });
});

/* --- Balance --- */
app.get("/api/balance/:material", (_req, res) => {
  const balance = db.getBalance(decodeURIComponent(_req.params.material));
  res.json({ balance });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Stock Register running at http://localhost:${PORT}`);
  console.log(`Network: http://<Your Computer IP Address>:${PORT}   (share this with LAN users)`);
});