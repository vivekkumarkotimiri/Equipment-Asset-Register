# Department Asset Register

A small web app for logging department equipment (keyboards, mouse, etc.)
with a live clock, date-range PDF/Excel export, public read-only access,
and admin-only data entry. Now backed by a real server + database, so it
works from multiple devices at once over your network.

## How it works

- `backend/` — a Node.js server (Express + SQLite) that stores all records
  in a single file, `backend/data.db`, and serves the website itself.
- `frontend/` — the web page (HTML/CSS/JS) that everyone sees in their browser.

Only **one computer** needs to run the server. Every other device (phone,
laptop, tablet) just opens that computer's address in a browser — no
installation needed on those devices.

## Setup (do this once)

1. Install [Node.js](https://nodejs.org) (version 18 or later) on the
   computer that will act as the server.
2. Open a terminal in the `backend` folder and install dependencies:

   ```
   cd backend
   npm install
   ```

3. Copy the example environment file and set your admin password:

   ```
   cp .env.example .env
   ```

   Then open `.env` in a text editor and change `ADMIN_USERNAME`,
   `ADMIN_PASSWORD`, and `JWT_SECRET` to your own values.

## Running the server

```
cd backend
npm start
```

You'll see something like:

```
Asset Register server running.
On this computer:        http://localhost:3000
From other devices on the same network: http://<this-computer's-IP>:3000
```

- On the server computer itself, open `http://localhost:3000`.
- On any other device connected to the **same Wi-Fi/network**, find this
  computer's local IP address (Windows: `ipconfig`, Mac/Linux: `ifconfig`
  or `ip addr`, look for something like `192.168.1.x`) and open
  `http://192.168.1.x:3000` in a browser.

Keep the terminal window open — closing it stops the server. To make the
server start automatically and keep running in the background, look into
tools like [pm2](https://pm2.keymetrics.io/) or running it as a system
service.

## Who can see and do what

- **Anyone** who opens the page can view all records and export them to
  PDF or Excel (a chosen date range, or the full history).
- **Only someone who logs in** with the admin username/password from
  `.env` can add new equipment records. The login check happens on the
  server (`backend/server.js`), not in the browser, so the password is
  never visible in the page's code.
- Each device that wants to add records needs to log in separately on
  that device; admin login isn't shared automatically between devices.

## Data storage

All records live in `backend/data.db`, a SQLite database file. This
persists across server restarts and computer reboots. Back this file up
periodically if the data matters — copying `data.db` elsewhere is a full
backup.

## Opening this to the internet (optional, advanced)

By default this only works on devices on the same local network as the
server computer. To make it reachable from outside (e.g. remote offices),
you'd need to either port-forward your router to this computer, or deploy
the `backend` folder to a hosting service (Render, Railway, a VPS, etc.).
That's a bigger step with its own security considerations — ask if you'd
like help with it.
