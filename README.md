
# Stock Entry Register

A web-based stock and issue management system for TGTRANSCO's AMC Contractor,
built on Node.js + SQLite. One computer runs the server; every other device on
the same network (or internet, if port-forwarded) opens it in a browser.

---

## Project Structure

```
stock entry register/
├── server.js                  Express server — API + serves the frontend
├── db.js                      SQLite database layer (two tables: records, stock)
├── data.db                    Auto-created on first run — DO NOT DELETE (your data)
├── package.json
├── .env.example               Copy this to .env and fill in your credentials
├── .env                       Your actual secrets (never share or commit this)
├── README.md
├── DEPLOYMENT.md              Guide for port-forwarding / internet access
└── frontend/
    ├── index.html             Main page (tabs + login modal + CAPTCHA)
    ├── images/
    │   └── logo.png           TGTRANSCO logo shown in the header
    ├── css/
    │   └── styles.css         All styling
    └── js/
        ├── config.js          API base URL + shared materials list
        ├── utils.js           escapeHtml(), buildMaterialSelect()
        ├── clock.js           Live date/time in the header
        ├── store.js           All fetch() calls to the backend API
        ├── auth.js            Login/logout, CAPTCHA, role-based tab visibility
        ├── entries.js         Issue Entry form logic
        ├── stock.js           Stock Entry form, stock table, summary table + exports
        ├── filters.js         Date-range filter for the Records tab
        ├── export.js          PDF and Excel export for Issue Records
        └── app.js             Tab switching, issue table render, app bootstrap
```

---

## One-Time Setup

### 1. Install Node.js

Download and install **Node.js v18 or later** from https://nodejs.org.

### 2. Install dependencies

Open a terminal/PowerShell inside the project folder and run:

```
npm install
```

### 3. Create your `.env` file

Copy the example file:

```
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Then open `.env` in a text editor and set your own values:

```
PORT=3030

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

USER_USERNAME=user
USER_PASSWORD=user123

JWT_SECRET=replace-this-with-a-long-random-string
TOKEN_EXPIRY=12h
```

> **Important:** Change `JWT_SECRET` to any long random string before real use.
> You can generate one at https://generate-secret.vercel.app/32

---

## Running the Server

```
npm start
```

You will see:

```
Stock Register running at http://localhost:3030
Network: http://192.168.x.x:3030
```

- Open `http://localhost:3030` on the server computer.
- Open `http://192.168.x.x:3030` from any other device on the same Wi-Fi/network
  (replace with the actual IP shown in your terminal).

**Keep the terminal open** — closing it stops the server.

To keep it running in the background (so it survives terminal closes), use
[pm2](https://pm2.keymetrics.io/):

```
npm install -g pm2
pm2 start server.js --name stock-register
pm2 save
pm2 startup
```

---

## User Roles & Access

There are three access levels. The login modal includes a **math CAPTCHA**
(e.g. "What is 4 + 7?") that must be answered correctly before credentials
are checked.

| Feature                       | Public | User | Admin |
| ----------------------------- | :----: | :--: | :---: |
| View Issue Records            |   ✅   |  ✅  |  ✅  |
| Export Records → PDF / Excel |   ✅   |  ✅  |  ✅  |
| Issue Entry tab (add records) |   ❌   |  ✅  |  ✅  |
| Delete issue records          |   ❌   |  ✅  |  ✅  |
| Stock Entry tab (add stock)   |   ❌   |  ❌  |  ✅  |
| Edit / Delete stock entries   |   ❌   |  ❌  |  ✅  |
| View Material Stock Summary   |   ❌   |  ❌  |  ✅  |
| Export Summary → PDF / Excel |   ❌   |  ❌  |  ✅  |

**Default credentials** (change in `.env` before sharing with others):

| Role  | Username | Password |
| ----- | -------- | -------- |
| Admin | admin    | admin123 |
| User  | user     | user123  |

Admin sessions and User sessions are stored separately in each browser's
local storage — logging in on one device does not affect any other device.

---

## Tabs

### 📋 Records (everyone)

- Full table of all issue records with S.No., Date, Department, Officer,
  Room, Extension, Material, Issued Qty, and Balance at time of issue.
- Filter by date range or view the full history.
- Export the current view to **PDF** or **Excel**.
- Admin and User see a **Delete** button on each row.

### ➕ Issue Entry (User + Admin)

- Select Department from a dropdown list of all TGTRANSCO departments.
- Fill in Officer Name, Room No, Extension.
- Select Material from the standard list; choosing **Other** shows a text
  box to type a custom material name.
- Once a material is selected (or typed), the **Balance** field auto-fills
  with the current available stock for that material.
- Save is blocked if the issued quantity exceeds available stock.
- Record Date defaults to today but can be changed.

### 📦 Stock Entry (Admin only)

Three sections on this tab:

1. **Add / Update Stock form** — Date, Material (same dropdown with Other
   support), Quantity. Click **Save** to add or **Update** after clicking
   Edit on a row below.
2. **Stock Entries log** — every stock addition, with Edit and Delete per row.
3. **Material Stock Summary** — one row per unique material showing:
   - Total Stocked (all additions)
   - Total Issued (all issue records)
   - Current Balance (stocked − issued), colour-coded green/grey/red.
   - Own **Export PDF** and **Export Excel** buttons for just this table.

---

## How Balance Works

Balance is calculated server-side as:

```
Balance = SUM(stock.quantity for material) − SUM(records.quantity for material)
```

- When adding an issue entry, the live balance is fetched and shown.
- The balance stored on each issue record is a **snapshot at the time of
  issue** (balance after that entry was saved).
- The Summary table always reflects the **current live totals**.

---

## Materials List

The standard dropdown (defined in `frontend/js/config.js`):

- Keyboard
- Mouse
- PC
- Printer
- SMPS
- CMOS Battery
- Teflon Sheet
- Pickup Roller
- Pressure Roller
- Other *(shows a free-text box; name is stored exactly as typed)*

To add more standard items, edit the `MATERIALS` array in `config.js`.

---

## Data Storage

All data lives in `data.db` (SQLite, created automatically on first run).

Two tables:

- **records** — issue entries (deptName, officerName, roomno, extension,
  material, quantity, balance, date, createdAt)
- **stock** — stock additions (material, quantity, date, createdAt)

**Back up `data.db` regularly** — it is the only copy of your records.
Copying the file elsewhere is a complete backup.

---

## Changing Credentials

Edit `.env` and restart the server:

```
npm start
```

Changes take effect immediately on next login. Existing sessions using old
tokens will expire within the `TOKEN_EXPIRY` window (default 12 hours).

---

## Accessing from the Internet

See **DEPLOYMENT.md** for the full step-by-step guide covering:

- Dynamic DNS (free hostname via DuckDNS so your IP doesn't matter)
- Port forwarding on your router
- HTTPS via Caddy (free automatic certificate — required before exposing
  to the internet so passwords aren't sent in plain text)

---

## Troubleshooting

| Problem                              | Fix                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `Cannot GET /`                     | Check that`frontend/` folder is in the same directory as `server.js` |
| Port already in use                  | Change`PORT=3030` in `.env` to another number e.g. `3031`          |
| `better-sqlite3` install error     | Run`npm approve-scripts better-sqlite3` then `npm install`           |
| Login button not appearing           | Hard-refresh the browser (`Ctrl+Shift+R`)                              |
| Balance shows 0 for "Other" material | Make sure the name is spelled identically in Stock Entry and Issue Entry |
| Can't reach from other devices       | Check firewall — allow inbound TCP on the port in Windows Defender      |
