# GitHub Pull Request Auto-Merge Webhook

This application is a Github webhook listener that listens for JIRA tickets to be moved to a specific status, and then automatically approves and merges the corresponding pull request in GitHub.

## Prerequisites
- A GitHub account and access to a repository
- A JIRA account and access to a project
- A DigitalOcean account (or other serverless functions hoster)
- doctl (DigitalOcean command line tool) installed and configured on your local machine (if using DO - otherwise make sure to take a look at the build.sh script and adjust the commands accordingly)
- Node.js and npm (Node Package Manager) installed on your local machine

## Note
This setup is was made specifically for Digitalocean so if you want to use another serverless functions hoster you will need to adjust the build.sh script accordingly and may do some changes to the code.

## Installation
1. Clone the repository to your local machine.
2. In the project root directory, run bash install.sh to install the dependencies.
3. Create a new function in DigitalOcean using the doctl command line tool by running doctl compute function create <FUNCTION_NAME>.
4. Navigate to the /src/ folder and run npm run watch to start the development server.
5. Create a new GitHub webhook for the repository you want to connect to JIRA. In the webhook settings, set the payload URL to the URL of your DigitalOcean function, and choose the "Issue comment" trigger.
6. In the JIRA project you want to connect to GitHub, create a new webhook that sends a payload to the URL of your DigitalOcean function.
7. In the root directory of the project, create a new file called .env and add the following environment variables:
GITHUB_CLASSIC_TOKEN.
This token is used for authenticating with the GitHub API. You can create a new token by going to your GitHub settings and selecting "Personal access tokens".

## Usage
ToDo

## Deployment on DigitalOcean
The function can be deployed to DigitalOcean using the doctl command line tool. To deploy the function and start watching for changes, run the following command in the project root directory:

```bash 
doctl compute function deploy <FUNCTION_NAME> --watch
```

You can also use the command `doctl compute function create <FUNCTION_NAME>` to create a new function in DigitalOcean. 

Alternatively you want to use packages.scripts in package.json - like npm run watch - which will also deploy the function to DigitalOcean and watch or
use install.sh to deploy the function once. This script can be executed multiple times to update the function.

## Connecting to JIRA
You will need to create a new webhook in the JIRA automation settings. The webhook should send a payload to the URL of your DigitalOcean function.

```json
 {
    "project": "{{project.name}}",
    "key": "{{issue.key}}",
    "status": "{{issue.status.name}}",
    "github_repo_name": "my-repo",
    "github_repo_owner": "my-username[OR]organization-name",
 }
```

## Note
Make sure to keep your tokens and credentials safe and do not share them with anyone.



## License 
The Unlicense (Public Domain) - see the LICENSE file for details