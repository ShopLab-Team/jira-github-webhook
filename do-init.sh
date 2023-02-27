#!/bin/bash

read -p "Have you installed and configured the doctl cli? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
  echo ""
  echo -e "Please install and configure the doctl cli.\nRead more here: https://docs.digitalocean.com/reference/doctl/how-to/install/"
  echo ""
  sleep 3
  exit 1
fi

echo "Building the project for Digitalocean..."

BUILD_PATH="./packages/jira-github/webhook"

FILES_TO_COPY=(
  "package.json"
  "webhook.js"
  ".ignore"
)

if [ ! -d "$BUILD_PATH" ]; then
  echo "Creating build folder..."
  mkdir -p $BUILD_PATH
fi

echo "Copying files to build folder..."
for file in "${FILES_TO_COPY[@]}"
do
  cp $file $BUILD_PATH
done

cp -R modules $BUILD_PATH/

read -p "Is this the first time you deploy this project? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Installing doctl serverless tools: https://docs.digitalocean.com/reference/doctl/reference/serverless/"
  doctl serverless install
  
  echo "Connecting to Digitalocean Functions..."
  doctl serverless connect

  # go to build folder
  cd $BUILD_PATH
  npm pkg delete scripts.prepare

  # go back to root folder
  cd ../../../ 

  echo "Deploying to Digitalocean Functions..."
  cd ../ && doctl serverless deploy jira-github-webhook --trace
  
  sleep 3
  echo "Build complete!"
  
  exit 1
fi

# go to build folder
cd $BUILD_PATH
npm pkg delete scripts.prepare

# go back to root folder
cd ../../../

echo "Deploying to Digitalocean Functions..."
cd ../ && doctl serverless deploy jira-github-webhook --trace

echo "Build complete!"