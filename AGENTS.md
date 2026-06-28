# AI Coding Agent Guidelines (AGENTS.md)

This file provides system instructions, build steps, design constraints, and data architecture patterns for AI coding agents working on the POSS Point of Sale repository.

---

## 1. Project Overview
POSS is a hybrid Point of Sale system optimized for cafe, bakery, and retail operations. It is designed to run across:
*   **Web Browsers** (React 18 + TypeScript core)
*   **Android Devices** (packaged via Capacitor)
*   **Windows Desktop Apps** (packaged via Electron)

---

## 2. Build, Run, and Package Commands

AI agents must use the following commands to test, compile, or build changes:

*   **Install Dependencies:** `npm install` (or `npm install --legacy-peer-deps` if resolution fails)
*   **Web Development Server:** `npm start`
*   **Production Web Build:** `npm run build`
*   **Desktop Development (Electron + React Live Reload):** `npm run electron:dev`
*   **Desktop Production Run:** `npm run build && npm run electron:start`
*   **Desktop Standalone Executable Packaging:** `npm run electron:build`
*   **Capacitor Android Copy/Sync:** `npm run build-android`
*   **Open Android Project (Android Studio):** `npm run open-android`

---

## 3. Core Architectural Rules

### A. Database Service & Compression
*   **Location:** [DatabaseService.ts](file:///Users/ahmadnabhaan/Documents/POSS/src/services/DatabaseService.ts)
*   **Schema (Supabase):** Tables (`pos_employees`, `pos_inventory`, `pos_transactions`, `pos_settings`) store a single row where `id = 1`.
*   **Pako zlib Compression:** All object arrays are converted to JSON, compressed using `pako.deflate()`, base64-encoded, and upserted. Conversely, reads are decompressed using `pako.inflate()`.
*   **Constraint:** DO NOT attempt to write standard SQL row updates or write uncompressed data directly to these tables. All list updates must keep the compressed single-row atomic array paradigm.

### B. DANA SNAP QRIS Integration
*   **Location:** [DanaService.ts](file:///Users/ahmadnabhaan/Documents/POSS/src/services/DanaService.ts) and [index.ts](file:///Users/ahmadnabhaan/Documents/POSS/supabase/functions/dana/index.ts)
*   **Endpoint:** Uses SNAP Generate QRIS Endpoint (Service Code `47`, MPM) under `/v1.0/qr/qr-mpm-generate.htm`.
*   **ID Mapping:** Always maps external shop ID `431c8d5c` and external division ID `5d94f0d0` inside sandbox API requests.
*   **Cancellations:** QRIS codes do not support server-side cancellation. Client-side controllers should stop the polling loop and flag the order as `CANCELLED` locally instead of calling the server-side DANA cancel endpoint.

---

## 4. UI & Visual Guidelines

*   **Landscape Constraints:** The application is landscape-only on tablet layouts. Ensure all layout panels are optimized for landscape grids and use flex row containers.
*   **Touch-Friendly Elements:** Elements must be touch-target friendly. Minimum button touch heights should be at least `44px` (or `h-12`). PIN-pad digits utilize `h-16` height.
*   **Brand Themes:** Use the tailored design colors defined in [DESIGN.md](file:///Users/ahmadnabhaan/Documents/POSS/DESIGN.md):
    *   Primary Action Fill: `orange-600` (`#ea580c`)
    *   Secondary Visual Badge: `brown-600` (`#a18072`)
    *   Standard Input Border: `border-gray-300` with `focus:ring-orange-500` ring focus styling.
