# Project Solver (MERN)
### Smart College Complaint & Grievance Management System

A full MERN (MongoDB, Express, React, Node.js) rebuild of Project Solver: a
complaint registry that automatically routes every submission to the right
person — a lab Wi-Fi issue to the branch Technical Dept, an attendance
dispute to the class Coordinator, a hostel issue to that block's Warden —
with a live animated routing map, role-based logins (Student/Staff/HOD/Admin),
and an Admin/HOD forwarding tool to manually re-route a case when the
automatic decision needs a human override.

This is the working, ready-to-run version of the app — a real Node/Express
API backed by MongoDB, and a real React frontend, not a simulated preview.

---

## How routing works

1. A student submits a complaint with a **category**, optional **keyword**
   (e.g. "wifi"), and optional **location tag** (e.g. `LAB-3`, `SECTION-A`,
   `BLOCK-2`).
2. `server/src/services/routingService.js` looks up the `routing_rules`
   collection for that category, keeps only the rules whose keyword/location
   pattern actually match, and picks the **most specific** match — so a
   generic "any TECHNICAL complaint → IT desk" rule and a more specific "any
   lab (`LAB-`) → branch Technical Dept" rule can coexist, and the specific
   one wins.
3. The role is filled by a real staff account scoped to that location, falling
   back to anyone holding that role.
4. **Harassment complaints skip the rule table entirely** — hard-coded straight
   to the HOD, marked confidential.
5. An hourly job (`escalationJob.js`) auto-bumps any complaint sitting
   untouched past a threshold (default 48h) up the chain: Coordinator /
   Technical Dept / Warden / Library / Maintenance → HOD → Admin.
6. **Admins (and HODs) can manually forward** any complaint to a different
   role or specific person at any time — every forward is logged with who
   did it and why, visible on the complaint's forward history.

## Tech stack

- **Backend**: Node.js, Express 5, MongoDB + Mongoose, JWT auth (bcrypt-hashed passwords), CORS, Morgan
- **Frontend**: React 19 (Vite), React Router, Axios, Lucide icons
- **Styling**: a hand-built "registry office" design system (kraft-paper palette, serif display headings, folder-tab navigation, an animated SVG routing map) — no UI kit

## Project layout

```
server/
  src/
    models/        User, Complaint, RoutingRule, ComplaintLog (Mongoose schemas)
    services/       routingService.js (the routing engine), escalationJob.js
    controllers/    auth, complaints, routingRules, users
    routes/         REST endpoints, wired to controllers
    middleware/     JWT auth + role guard
    seed.js         demo accounts + routing rules
    index.js        app entrypoint
client/
  src/
    context/        AuthContext (JWT session state)
    api/            axios client with auth header
    pages/          Login, Register, Dashboard
    components/     RoutingMap (animated), ForwardModal, Crest (seal emblem), ProtectedRoute
    styles/         theme.css (design tokens, shared classes)
```

## Prerequisites

Install these on your laptop before starting:

1. **Node.js 18 or newer** — check with `node -v`. Get it from [nodejs.org](https://nodejs.org) if you don't have it.
2. **MongoDB** — either:
   - **Local install**: [MongoDB Community Server](https://www.mongodb.com/try/download/community) (gives you `mongod` running on `localhost:27017`), or
   - **Free cloud database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — create a free cluster and copy its connection string. Simpler if you don't want to install a database locally.
3. A terminal (macOS Terminal, Windows PowerShell/CMD, or a code editor's built-in terminal like VS Code).

You will run the backend and frontend **at the same time, in two separate terminal windows/tabs.** Keep both open while you use the app.

## Running it — step by step

### Step 1 — Unzip the project
Unzip this file anywhere on your laptop. You should see two folders: `server/` and `client/`.

### Step 2 — Start MongoDB
- **Local install**: open a terminal and run `mongod` (or start it as a service — on Windows it's usually already running as a service after install; on Mac with Homebrew: `brew services start mongodb-community`). Leave this running, or confirm the MongoDB service is active.
- **Atlas (cloud)**: no local step needed — just have your connection string ready for Step 3.

### Step 3 — Backend (Terminal 1)
```bash
cd server
npm install
```
Then create your environment file:
```bash
cp .env.example .env
```
Open the new `.env` file in a text editor. If you're using **local MongoDB**, the default `MONGO_URI` already works — leave it as is. If you're using **Atlas**, replace `MONGO_URI` with the connection string Atlas gave you.

Now seed the demo data and start the server:
```bash
npm run seed     # creates demo accounts + routing rules (one-time; safe to re-run, it resets the data)
npm run dev      # starts the API on http://localhost:5000
```
You should see `Project Solver API listening on :5000` and `MongoDB connected`. **Leave this terminal running.**

### Step 4 — Frontend (Terminal 2 — open a new terminal window/tab)
```bash
cd client
npm install
```
Then create its environment file:
```bash
cp .env.example .env
```
The default value (`http://localhost:5000/api`) already matches the backend from Step 3 — no edit needed unless you changed the backend's port.

Start it:
```bash
npm run dev
```
You should see a local URL, usually `http://localhost:5173`.

### Step 5 — Open it
Go to **http://localhost:5173** in your browser. You'll land on the login screen. Click any of the demo-account chips (or type the email/password yourself — password is `password123` for all of them) to sign in.

## Troubleshooting

| Problem | Likely fix |
|---|---|
| Backend prints `Failed to connect to MongoDB` | MongoDB isn't running (local) or `MONGO_URI` in `server/.env` is wrong (Atlas) — double-check it's actually reachable |
| Frontend loads but login says "Incorrect email or password" for a demo account | Run `npm run seed` again inside `server/` — the accounts may not have been created yet |
| Frontend can't reach the backend (network error on login) | Make sure the backend terminal (Step 3) is still running, and that `client/.env`'s `VITE_API_URL` matches the backend's actual port |
| `npm install` fails | Confirm `node -v` is 18+; delete `node_modules` and the `package-lock.json` in that folder and try again |
| Port 5000 or 5173 already in use | Change `PORT` in `server/.env` (and update `VITE_API_URL` in `client/.env` to match), or stop whatever else is using that port |

## Seeded demo accounts (password for all: `password123`)

| Name | Email | Role | Scope |
|---|---|---|---|
| System Admin | `admin@solver.edu` | Admin | — |
| Professor Sammer Dev Sharma | `hod.cse@solver.edu` | HOD | CSE dept |
| Prof. Mehta | `coordinator.a@solver.edu` | Class Coordinator | SECTION-A |
| Ravi | `tech.cse@solver.edu` | Technical Dept | BRANCH-CSE |
| Warden Sharma | `warden.block2@solver.edu` | Hostel Warden | BLOCK-2 |
| Ms. Iyer | `library@solver.edu` | Library Staff | — |
| Facilities Team | `maintenance@solver.edu` | Maintenance | — |
| Aarav Anshu | `student@solver.edu` | Student | SECTION-A |
| `student@solver.edu` | Student | SECTION-A |

The Login page has one-click buttons to autofill any of these.

**Try this flow**: log in as the student, file a Technical complaint with
location `LAB-3` — watch the routing map light up the path live as you type,
then watch the dot fly from Student → Routing Engine → Technical Dept on
submit. Then log in as `admin@solver.edu`, open **All complaints**, and hit
**Forward** on that case to manually re-route it to, say, the HOD, with a note
explaining why.

## API reference (quick)

| Method | Route | Who | What |
|---|---|---|---|
| POST | `/api/auth/register` | public | student self-signup |
| POST | `/api/auth/login` | public | returns `{ token, user }` |
| GET | `/api/auth/me` | any signed-in user | current profile |
| POST | `/api/complaints` | any signed-in user | file a complaint (auto-routed) |
| GET | `/api/complaints/my` | any | complaints you filed |
| GET | `/api/complaints/queue` | any | complaints assigned to you |
| GET | `/api/complaints/all` | Admin/HOD | every complaint |
| PUT | `/api/complaints/:id/status` | any assignee | change status |
| PUT | `/api/complaints/:id/forward` | Admin/HOD | manually re-route |
| GET | `/api/complaints/:id/timeline` | any | audit log for a case |
| GET/POST/PUT/DELETE | `/api/routing-rules` | read: any · write: Admin | routing rules |
| GET/POST | `/api/users` | Admin | staff accounts |
| GET | `/api/users/by-role/:role` | Admin/HOD | staff options for the forward dropdown |

## Notes before using this for real

- `JWT_SECRET` in `.env` is a placeholder — change it.
- CORS is wide open (`cors()`) for local development — restrict it to your deployed frontend's origin in production.
- There's no rate limiting or email verification — fine for a class project, not for production.
- Seeded demo passwords should be changed (or the accounts removed) before any real deployment.
