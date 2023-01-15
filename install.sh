#!/bin/bash

# Build the project
echo "Setting up the project..."

# Build Path Variable
BUILD_PATH="./packages/code/github-jira-webhook"

# Source Directory
SRC_DIR="./src"

# Create build path if doesnt exist
if [ ! -d "$BUILD_PATH" ]; then
  mkdir -p $BUILD_PATH
fi

# copy all files in src to build folder
cp -r ./src/* $BUILD_PATH

# copy .ignore to build folder
cp ./src/.ignore $BUILD_PATH

# install dependencies
cd src && npm install

# go back to root
cd ..

# prompt user to validate that he has the doctl cli installed if not exit
read -p "Have you installed the doctl cli? (y/n) " -n 1 -r
echo   # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "Continuing with the build..."

# prompt user to validate that he has the doctl cli installed if not exit
read -p "Have you created a Digital Ocean account? (y/n) " -n 1 -r
echo   # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "Continuing with the build..."

# prompt if user has created a personal access token
read -p "Have you created a personal access token? (y/n) " -n 1 -r
echo   # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "Continuing with the build..."

# prompt user if he has used functions before if not show him link to documentation
read -p "Have you used Digital Ocean Functions before? (y/n) " -n 1 -r
echo   # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please read the documentation here: https://www.digitalocean.com/docs/functions/"
    exit 1
fi

echo "Continuing with the build..."

# go up a directory
cd ..

# run the dctl command
doctl serverless deploy jira-github-webhook

# building complete
echo "Build complete"


