/* ================================================================
   DB  — two tables:
   • records  : issue entries (what was given out to departments)
   • stock    : stock additions (what was received into inventory)
   Balance for a material = SUM(stock.quantity) - SUM(records.quantity)
   ================================================================ */
const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "data.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    deptName    TEXT NOT NULL,
    officerName TEXT NOT NULL,
    roomno      TEXT NOT NULL DEFAULT '',
    extension   TEXT NOT NULL DEFAULT '',
    material    TEXT NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 0,
    balance     INTEGER NOT NULL DEFAULT 0,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock (
    id        TEXT PRIMARY KEY,
    date      TEXT NOT NULL,
    material  TEXT NOT NULL,
    quantity  INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

const stmts = {
  recInsert: db.prepare(`
    INSERT INTO records (id,date,deptName,officerName,roomno,extension,material,quantity,balance,createdAt)
    VALUES (@id,@date,@deptName,@officerName,@roomno,@extension,@material,@quantity,@balance,@createdAt)
  `),
  recAll:    db.prepare(`SELECT * FROM records ORDER BY date DESC, createdAt DESC`),
  recById:   db.prepare(`SELECT * FROM records WHERE id=?`),
  recDelete: db.prepare(`DELETE FROM records WHERE id=?`),

  stkInsert: db.prepare(`
    INSERT INTO stock (id,date,material,quantity,createdAt)
    VALUES (@id,@date,@material,@quantity,@createdAt)
  `),
  stkAll:    db.prepare(`SELECT * FROM stock ORDER BY date DESC, createdAt DESC`),
  stkById:   db.prepare(`SELECT * FROM stock WHERE id=?`),
  stkUpdate: db.prepare(`UPDATE stock SET date=@date, material=@material, quantity=@quantity WHERE id=@id`),
  stkDelete: db.prepare(`DELETE FROM stock WHERE id=?`),

  totalStocked: db.prepare(`SELECT COALESCE(SUM(quantity),0) AS total FROM stock WHERE material=?`),
  totalIssued:  db.prepare(`SELECT COALESCE(SUM(quantity),0) AS total FROM records WHERE material=?`)
};

module.exports = {
  getAllRecords(){ return stmts.recAll.all(); },
  addRecord(rec){
    stmts.recInsert.run(rec);
    return stmts.recById.get(rec.id);
  },
  deleteRecord(id){
    if(!stmts.recById.get(id)) return false;
    stmts.recDelete.run(id);
    return true;
  },

  getAllStock(){ return stmts.stkAll.all(); },
  addStock(entry){
    stmts.stkInsert.run(entry);
    return stmts.stkById.get(entry.id);
  },
  updateStock(entry){
    if(!stmts.stkById.get(entry.id)) return null;
    stmts.stkUpdate.run(entry);
    return stmts.stkById.get(entry.id);
  },
  deleteStock(id){
    if(!stmts.stkById.get(id)) return false;
    stmts.stkDelete.run(id);
    return true;
  },

  getBalance(material){
    const stocked = stmts.totalStocked.get(material).total;
    const issued  = stmts.totalIssued.get(material).total;
    return stocked - issued;
  }
};