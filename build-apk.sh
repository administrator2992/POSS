#!/bin/bash

# POSS APK Build Script

echo "Building POSS for Android..."

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm is not installed. Please install npm to continue."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the React app
echo "Building React app..."
npm run build

# Check if Capacitor CLI is available
if ! command -v npx &> /dev/null
then
    echo "npx is not available. Please ensure npm is properly installed."
    exit 1
fi

# Copy web assets to native platforms
echo "Copying web assets to Android platform..."
npx cap copy android

echo "Build process completed!"
echo ""
echo "To generate the APK:"
echo "1. Open Android Studio"
echo "2. Open the android/ folder as a project"
echo "3. Select 'Build' -> 'Generate Signed Bundle / APK'"
echo "4. Choose 'APK' and follow the wizard"
echo ""
echo "The APK will be generated in android/app/release/"