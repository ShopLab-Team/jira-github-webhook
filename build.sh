#!/bin/bash

# Build the project
echo "Building the project..."

# Build Path Variable
BUILD_PATH="./packages/code/github-jira-webhook"

# Source Directory
SRC_DIR="./src"

# Create build path if doesnt exist
if [ ! -d "$BUILD_PATH" ]; then
  mkdir -p $BUILD_PATH
fi

# copy .ignore to build folder
cp ./src/.ignore $BUILD_PATH

# copy webhook.js to build folder
cp ./src/webhook.js $BUILD_PATH

# copy package.json to build folder
cp ./src/package.json $BUILD_PATH

# buid function code
cd ../ && doctl serverless deploy jira-github-webhook --trace

# building complete
echo "Build complete"