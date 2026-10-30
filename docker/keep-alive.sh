#!/bin/bash
echo "[KeepAlive Worker] Started. Waiting 2 minutes before first ping..."
sleep 120

while true; do
  RAW_URL="${APP_URL:-https://travel-saas-platform.quick.blitz.cloud}"
  CLEAN_URL="${RAW_URL%/}"
  TARGET_URL="${CLEAN_URL}/health"

  echo "[KeepAlive Worker] Sending ping to: $TARGET_URL at $(date)..."
  if command -v curl >/dev/null 2>&1; then
    curl -s -f -A "TravelSaaS-KeepAlive-Worker/1.0" "$TARGET_URL" > /dev/null 2>&1 && echo "[KeepAlive Worker] Ping OK" || echo "[KeepAlive Worker] Ping failed (will retry)"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O - "$TARGET_URL" > /dev/null 2>&1 && echo "[KeepAlive Worker] Ping OK" || echo "[KeepAlive Worker] Ping failed (will retry)"
  fi

  # Sleep for 20 minutes (1200 seconds)
  sleep 1200
done

