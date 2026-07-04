/* ================================================================
   DB
   Opens (or creates) data.db in this folder and exposes simple
   functions for reading/writing equipment records. SQLite stores
   everything in a single file on disk, so data survives server
   restarts and computer reboots — this is the "permanent storage."
   ================================================================ */
const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "data.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    deptName TEXT NOT NULL,
    officerName TEXT NOT NULL,
    keyboards INTEGER NOT NULL DEFAULT 0,
    mouse INTEGER NOT NULL DEFAULT 0,
    other TEXT DEFAULT '',
    createdAt TEXT NOT NULL
  )
`);

const statements = {
  insert: db.prepare(`
    INSERT INTO records (id, date, deptName, officerName, keyboards, mouse, other, createdAt)
    VALUES (@id, @date, @deptName, @officerName, @keyboards, @mouse, @other, @createdAt)
  `),
  all: db.prepare(`SELECT * FROM records ORDER BY date DESC, createdAt DESC`),
  byId: db.prepare(`SELECT * FROM records WHERE id = ?`),
  remove: db.prepare(`DELETE FROM records WHERE id = ?`)
};

module.exports = {
  getAllRecords(){
    return statements.all.all();
  },
  addRecord(record){
    statements.insert.run(record);
    return statements.byId.get(record.id);
  },
  deleteRecord(id){
    const existing = statements.byId.get(id);
    if(!existing) return false;
    statements.remove.run(id);
    return true;
  }
};
