#!/bin/bash
cd /app/backend

if [ -f "dist/src/main.js" ]; then
    echo "Starting backend from dist/src/main.js..."
    exec node dist/src/main.js
elif [ -f "dist/main.js" ]; then
    echo "Starting backend from dist/main.js..."
    exec node dist/main.js
else
    echo "Error: main.js not found in dist. Directory contents:"
    find dist -maxdepth 3
    exit 1
fi
