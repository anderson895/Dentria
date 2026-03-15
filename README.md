# 🦷 Dentra — Dental Management System

A full-stack dental clinic management system built with **Next.js 14**, **Material UI**, **MongoDB Atlas**, and **Cloudinary**.

---

## ✨ Features

- 🦷 **Interactive Dental Chart** — SVG-based 32-tooth chart with per-tooth labeling, condition tracking, and X-ray uploads
- 👥 **Patient Management** — Full CRUD with photo uploads, medical history, and allergies
- 📅 **Appointment System** — Weekly calendar view, status management, and appointment types
- 🔐 **Auth** — Secure signup/login with NextAuth.js & JWT sessions
- ☁️ **Cloudinary** — Patient avatar + X-ray image uploads via the `Dentra` preset
- 📊 **Dashboard** — Real-time stats and today's schedule at a glance

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/dentra

# NextAuth
NEXTAUTH_SECRET=your-random-secret-string   # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Dentra
```

### 3. Set Up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → Settings → Upload
2. Create an **Unsigned** upload preset named exactly **`Dentra`**
3. Set the folder to `dentra` (optional)

### 4. Set Up MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add a database user with read/write access
3. Whitelist your IP (or `0.0.0.0/0` for development)
4. Copy the connection string into `MONGODB_URI`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Project Structure

```
dentra/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth + register endpoint
│   │   ├── patients/      # Patient CRUD + teeth records
│   │   ├── appointments/  # Appointment CRUD
│   │   ├── dashboard/     # Stats API
│   │   └── upload/        # Cloudinary upload proxy
│   ├── dashboard/         # Protected dashboard pages
│   │   ├── patients/      # Patient list + detail + new
│   │   ├── appointments/  # Calendar + booking
│   │   └── teeth/         # Standalone teeth chart
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/
│   ├── appointments/      # AppointmentsClient
│   ├── patients/          # PatientsClient, PatientForm, PatientDetail
│   ├── teeth/             # TeethChart (main interactive chart)
│   ├── DashboardHome.tsx  # Dashboard stats
│   └── Providers.tsx      # MUI Theme + NextAuth
├── lib/
│   ├── mongodb.ts         # DB connection with caching
│   └── cloudinary.ts      # Cloudinary SDK config
├── models/
│   ├── User.ts            # User model with bcrypt
│   ├── Patient.ts         # Patient + teeth records
│   └── Appointment.ts     # Appointment model
├── types/
│   └── next-auth.d.ts     # Session type extensions
└── middleware.ts           # Route protection
```

---

## 🦷 Dental Chart — Tooth Numbering

Uses the **Universal Numbering System (UNS)**:

- **Upper teeth**: #1 (upper right 3rd molar) → #16 (upper left 3rd molar)
- **Lower teeth**: #17 (lower left 3rd molar) → #32 (lower right 3rd molar)

### Supported Conditions

| Condition | Color |
|-----------|-------|
| Healthy | 🟢 Green |
| Cavity | 🔴 Red |
| Filling | 🟠 Orange |
| Crown | 🟣 Purple |
| Root Canal | 🩷 Pink |
| Missing | ⚫ Gray |
| Extraction Needed | 🔴 Deep Orange |
| Implant | 🔵 Blue |

---

## 📅 Appointment Types

`checkup` · `cleaning` · `filling` · `extraction` · `root_canal` · `crown` · `consultation` · `emergency` · `other`

## Appointment Status Flow

`scheduled` → `confirmed` → `in_progress` → `completed`

---

## 🛡️ Roles

| Role | Access |
|------|--------|
| `admin` | Full access |
| `dentist` | Patients, appointments, teeth charts |
| `receptionist` | Patients, appointments |

---

## 🚀 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in the Vercel project settings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| UI | Material UI v5 |
| Database | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js v4 |
| Images | Cloudinary (preset: `Dentra`) |
| Styling | MUI Theme + Tailwind |
| Language | TypeScript |
