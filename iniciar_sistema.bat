@echo off
title Sistema SCADA LEV - Iniciar Todos los Servicios
echo ===================================================
echo   Iniciando Servicios SCADA LEVs (CICATA - IPN)
echo ===================================================
echo.

:: 1. Iniciar InfluxDB en segundo plano
echo [1/3] Iniciando servicio InfluxDB...
start "InfluxDB Engine" /min ".\influxdb\influxd.exe"

:: 2. Iniciar Node-RED
echo [2/3] Iniciando Node-RED...
start "Node-RED Flow" /min cmd /c "node-red"

:: 3. Iniciar Frontend (Vite) + Express Server
echo [3/3] Iniciando Servidor Express y Frontend React...
npm run dev:all

pause
