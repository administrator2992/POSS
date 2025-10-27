# POSS Database Demo

This demo shows how the database service works in the POSS system.

## Prerequisites

Make sure you have the following installed:
- Node.js
- npm

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

## Database Features Demo

### 1. Employee Management
- Employees are stored persistently using Capacitor Storage
- PIN-based authentication retrieves employee data from storage
- Employee data persists across app restarts

### 2. Inventory Management
- All inventory items are stored in device storage
- Changes to inventory (add, update, delete) are immediately saved
- Inventory data is available after app restarts

### 3. Transaction History
- Completed transactions are automatically saved
- Transaction history is accessible from the history menu
- All transaction data persists across sessions

### 4. Network Broadcasting
- Data can be broadcast to other devices on the same network
- Broadcasting can be enabled/disabled in Settings
- Manual sync option available

## Android Deployment

To build for Android:
```bash
npm run build-android
```

This will:
1. Create an optimized production build
2. Copy assets to the Android project
3. Open Android Studio for final APK generation

## Key Benefits

1. **No Server Required**: All data is stored locally on the device
2. **Persistent Storage**: Data survives app restarts and device reboots
3. **Network Sharing**: Data can be shared with other devices on the network
4. **Android Compatible**: Fully compatible with Android deployment via Capacitor
5. **Seamless Integration**: Works with existing UI components without changes

## Technical Details

- Uses Capacitor Storage plugin for cross-platform compatibility
- Implements async/await pattern for reliable data operations
- Provides TypeScript interfaces for type safety
- Follows singleton pattern for efficient resource usage