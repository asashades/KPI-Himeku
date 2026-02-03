#!/bin/bash

echo "🎯 KPI Himeku - Starting Application..."
echo ""
echo "Installing dependencies (if needed)..."
npm install

echo ""
echo "Starting development server..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""
echo "Default Login:"
echo "Username: admin"
echo "Password: admin123"
echo ""

npm run dev
