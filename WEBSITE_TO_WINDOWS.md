# Converting and Packaging a Web Application for Windows (Electron)

This document provides a guide on how to run, develop, and build the POSS web/Android project as a Windows desktop application.

## Overview

The POSS project is a React and TypeScript application that runs on Android via Capacitor. To run POSS on Windows as a native desktop application, we wrap the React compilation output (`build/`) using **Electron**. 

Electron packages standard web files and runs them in a Chromium-based browser window with Node.js integration capabilities.

## Prerequisites

Before starting, ensure you have:
1. **Node.js** (v16 or higher) and **NPM** installed.
2. The project dependencies installed (`npm install` or `npm install --legacy-peer-deps`).

## Development and Scripts

We have added new NPM scripts to `package.json` to facilitate Windows desktop development.

### 1. Run in Development Mode (Live Reload)

Runs the React development server concurrently with Electron. Any code changes made to the React code will instantly hot-reload inside the Electron window.

```bash
npm run electron:dev
```

*Behind the scenes:* This command starts the React webpack server (on port 3000) and waits for it to become available using `wait-on`, then opens the Electron wrapper loading `http://localhost:3000`.

### 2. Run in Production Mode (Static Files)

Loads the production build directory (`build/`) inside Electron. Use this to verify that the app builds and loads assets successfully without any local server.

```bash
# Build the React files first
npm run build

# Run Electron pointing to the build folder
npm run electron:start
```

*Behind the scenes:* This loads `build/index.html` via the Electron `file://` protocol.

### 3. Build/Package the Windows App

Compiles the React files and packages them using `electron-builder` into a standalone Windows installer (`.exe`) or portable executable.

```bash
npm run electron:build
```

*Behind the scenes:* The output executable and packaging files are generated under the `/dist-electron` directory.

## Implementation Details

### Data Persistence
The POSS project utilizes `@capacitor/storage` for persisting employee, inventory, and transaction data. 
In the Electron environment, `@capacitor/storage` automatically falls back to standard Chromium `window.localStorage`. Chromium isolates localStorage per Electron application data folder and persists it indefinitely. Thus, no database code modifications were required.

### Asset Paths
To ensure Electron can load CSS, JS, and image assets using the `file://` protocol, we set `"homepage": "."` in `package.json`. This tells `react-scripts` to build with relative paths (`./static/...`) instead of absolute paths (`/static/...`).

### Landscape Mode
Since POSS is designed for landscape layout (e.g. tablets), the Electron main process maximizes the window upon launch (`mainWindow.maximize()`) to simulate a landscape POS kiosk layout on desktop screens.
