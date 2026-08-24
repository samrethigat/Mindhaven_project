@echo off
echo ===================================================
echo   Starting MindHaven Full-Stack Support System
echo ===================================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo ===================================================
npx -y concurrently --names "BACKEND,FRONTEND" -c "bgBlue.bold,bgGreen.bold" "npm --prefix backend run dev" "npm --prefix frontend run dev"
pause
