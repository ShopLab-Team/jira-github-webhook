/**
 * @author: Mark <ShopLab Team>
 * @description: This webhook is triggered from JIRA Actions and approves the corresponding pull request in Github.
 * @version: 1.2.0
 * @license: The Unlicense (https://unlicense.org/)
 * @see:
 * https://developer.github.com/v3/pulls/
 */

const {
  findPullRequest,
  mergePullRequest,
  approvePullRequest
} = require("./modules/core");

/**
 * Main function that is called by the webhook
 * @param {json} jsonPayload
 * @returns {object} {success: boolean, message: string}
 */
exports.main = async (jsonPayload) => {
  const webhookPayload = jsonPayload;

  // check if the webhook payload contains the required data
  const {
    project,
    key: ticketKey,
    status: ticketStatus,
    github_repo_name: gitRepoName,
    github_repo_owner: gitRepoOwner
  } = webhookPayload;

  if (
    !project ||
    !ticketKey ||
    !ticketStatus ||
    !gitRepoName ||
    !gitRepoOwner
  ) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        message: "Missing required data from payload"
      })
    };
  }

  // lookup the pull request number for the given ticket key
  const pullRequestResult = await findPullRequest(
    ticketKey,
    gitRepoName,
    gitRepoOwner
  );

  if (pullRequestResult.success) {
    const approvalResult = await approvePullRequest(
      pullRequestResult.data,
      gitRepoName,
      gitRepoOwner,
      ticketKey,
      ticketStatus
    );
    if (!approvalResult.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalResult)
      };
    }

    // merge the pull request
    const mergeResult = await mergePullRequest(
      pullRequestResult.data,
      gitRepoName,
      gitRepoOwner
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mergeResult)
    };
  }
  return {
    statusCode: 400,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pullRequestResult)
  };
};
