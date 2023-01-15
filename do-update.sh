#!/bin/bash

echo "Copying files to build folder..."

BUILD_PATH="./packages/jira-github/webhook"

FILES_TO_COPY=(
  "package.json"
  "webhook.js"
  ".ignore"
)

if [ ! -d "$BUILD_PATH" ]; then
  echo "Running first time build & deploy script..."
  bash do-init.sh
  sleep 2
  exit 1
fi

for file in "${FILES_TO_COPY[@]}"
do
  cp $file $BUILD_PATH
done

cp -R modules $BUILD_PATH/

# go to build folder
cd $BUILD_PATH
npm pkg delete scripts.prepare

# go back to root folder
cd ../../../

echo "Deploying to Digitalocean Functions..."
cd ../ && doctl serverless deploy jira-github-webhook --trace

echo "Updating files complete!"