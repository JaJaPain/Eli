@echo off
title Eli's Warning Visualizer Server
echo [SYSTEM] Starting local server for p5.js visualizer...
echo [SYSTEM] Access your visualizer at http://localhost:8000

:: Start the browser first with a slight delay or start server in background
start "" "http://localhost:8000"

:: Start the python server (this will keep the window open)
python -m http.server 8000
pause
