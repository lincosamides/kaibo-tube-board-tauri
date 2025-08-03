#!/bin/bash

# Script to configure bundle targets based on build target
TARGET_ARCH="$1"

if [[ "$TARGET_ARCH" == "aarch64-unknown-linux-gnu" ]]; then
    echo "Configuring for ARM64 Linux - disabling AppImage"
    # Create a temporary tauri.conf.json without AppImage
    jq '.bundle.targets = ["deb", "rpm"]' src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp
    mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
else
    echo "Using default bundle configuration"
fi
