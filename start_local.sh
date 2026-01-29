#!/bin/bash

# HPES Local Development Startup Script

echo "🚀 Starting HPES in Local Development Mode..."
echo ""

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Run: cd backend && python3 -m venv venv"
    exit 1
fi

# Start backend in background
echo "🐍 Starting Backend (FastAPI)..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend in background
echo "⚛️  Starting Frontend (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ HPES is running!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services..."

# Trap Ctrl+C and kill both processes
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT

# Wait for user interrupt
wait
