/**
 * @author: Mark <ShopLab Team>
 * @description: This webhook is triggered from JIRA Actions and approves the corresponding pull request in Github.
 * @version: 1.2.0
 * @license: The Unlicense (https://unlicense.org/)
 * @see:
 * https://developer.github.com/v3/pulls/
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { Octokit } = require("@octokit/core");

const octokit = new Octokit({ auth: process.env.GITHUB_CLASSIC_TOKEN });

/**
 * Checks if the title starts with the (release) keyword
 * @param {string} title
 * @returns {boolean}
 */
const startsWithRelease = (title) => {
  const startsWithRegex = /^\(release\)/i;
  return title.match(startsWithRegex);
};

/**
 * Checks if the title contains the ticket key and returns the matching key if found
 * @param {string} title
 * @param {string} ticketKey
 * @returns {Array | null} The match array if the key is found, null otherwise
 */
const containsTicketKey = (title, ticketKey) => {
  const projectPrefix = ticketKey.split("-")[0];
  const containsTicketKeyRegex = new RegExp(`(${projectPrefix}-\\d+)`, "i");
  return title.match(containsTicketKeyRegex);
};

/**
 * Checks if the ticket key is in the pull request title
 * @param {string} prTitle
 * @param {string} ticketKey
 * @returns {object} {success: boolean, message: string, data: string}
 */
const isTicketInPrTitle = (prTitle, ticketKey) => {
  // Check if the title starts with "(release)"
  if (!startsWithRelease(prTitle)) {
    return {
      success: false,
      message: `Ticket does not match required prefix (release) in pull request title ${prTitle}`,
      data: null
    };
  }

  // Check if the title contains the ticket key
  const match = containsTicketKey(prTitle, ticketKey);
  if (!match) {
    return {
      success: false,
      message: `No match found for ticket key ${ticketKey} in pull request title ${prTitle}`,
      data: null
    };
  }

  // Check if the ticket key in the title matches the given ticket key
  if (match[1].toUpperCase() !== ticketKey.toUpperCase()) {
    return {
      success: false,
      message: `Ticket key in pull request title does not match ${ticketKey}`,
      data: null
    };
  }

  return {
    success: true,
    message: "Ticket key found in pull request title",
    data: match[1]
  };
};

/**
 * Finds the pull request for the given ticket key
 * @param {string} ticketKey  The ticket key to search for in the pull request title
 * @param {string} gitRepoName
 * @param {string} gitRepoOwner
 * @returns {object} {success: boolean, message: string, data: number}
 */
async function findPullRequest(ticketKey, gitRepoName, gitRepoOwner) {
  try {
    // get all open pull requests for the given repository
    const { data: pullRequests } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls",
      {
        owner: gitRepoOwner,
        repo: gitRepoName,
        state: "open",
        base: "master",
        per_page: 100
      }
    );

    // find the pull request with the ticket key in the title
    // TODO: Error handling makes no sense because it will always throw an error if no pull request is found
    // i need to get error message from isTicketInPrTitle and return it here instead
    const pullRequest = pullRequests.find((pr) => {
      const match = isTicketInPrTitle(pr.title, ticketKey);
      return match.success && match.data === ticketKey;
    });

    if (!pullRequest) {
      return {
        success: false,
        message: `No pull request found for ticket key ${ticketKey}`
      };
    }
    return {
      success: true,
      message: `Pull request found for ticket key ${ticketKey}`,
      data: pullRequest.number
    };
  } catch (error) {
    throw new Error(`Failed to find pull request: ${error.message}`);
  }
}

/**
 * Posts a comment on the pull request with the given number for the given repository
 * @param {number} pullRequestNr
 * @param {string} gitRepoName
 * @param {string} gitRepoOwner
 * @param {string} comment
 * @returns
 */
async function postCommentOnPullRequest(
  pullRequestNr,
  gitRepoName,
  gitRepoOwner,
  comment
) {
  try {
    const { data } = await octokit.request(
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
      {
        owner: gitRepoOwner,
        repo: gitRepoName,
        issue_number: pullRequestNr,
        body: comment
      }
    );
    return {
      status: "success",
      message: "Comment posted successfully",
      data
    };
  } catch (error) {
    return {
      status: "error",
      message: `Failed to post comment on pull request: ${error.message}`
    };
  }
}

/**
 * Approves the pull request with the given number for the given repository and adds a comment to the pull request
 * @param {number} pullRequestNr  The number of the pull request to approve
 * @param {string} gitRepoName
 * @param {string} gitRepoOwner
 * @param {string} ticketKey
 * @param {string} ticketStatus
 * @returns {object} {success: boolean, message: string, data: object}
 */
async function approvePullRequest(
  pullRequestNr,
  gitRepoName,
  gitRepoOwner,
  ticketKey,
  ticketStatus
) {
  try {
    // Github Comment to be added to the PR
    const prComment = `Ticket ${ticketKey} has been moved to ${ticketStatus}.`;
    await postCommentOnPullRequest(
      pullRequestNr,
      gitRepoName,
      gitRepoOwner,
      prComment
    );
    const { data } = await octokit.request(
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
      {
        owner: gitRepoOwner,
        repo: gitRepoName,
        pull_number: pullRequestNr,
        event: "APPROVE"
      }
    );
    return {
      success: true,
      message: "Pull request successfully approved",
      data
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to approve pull request: ${error.message}`
    };
  }
}

/**
 * Checks if the pull request with the given number for the given repository has been approved by at least one reviewer
 * @param {number} pullRequestNr
 * @param {string} gitRepoName
 * @param {string} gitRepoOwner
 * @returns {object} {status: string, message: string}
 */
async function hasPullRequestBeenApproved(
  pullRequestNr,
  gitRepoName,
  gitRepoOwner
) {
  try {
    const { data: reviews } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
      {
        owner: gitRepoOwner,
        repo: gitRepoName,
        pull_number: pullRequestNr
      }
    );

    // check if there is at least one review with the "APPROVED" state
    const approvedReview = reviews.find(
      (review) => review.state === "APPROVED"
    );
    if (!approvedReview) {
      return {
        status: "error",
        message: "pull request has not been approved"
      };
    }

    return {
      status: "success",
      message: "pull request has been approved"
    };
  } catch (error) {
    return {
      status: "error",
      message: `Failed to check pull request approval: ${error.message}`
    };
  }
}

/**
 * Checks if the pull request with the given number for the given repository can be merged
 * @param {number} pullRequestNr
 * @param {string} gitRepoName
 * @param {string} gitRepoOwner
 * @returns {object} {status: boolean, message: string}
 */
async function canMergePullRequest(pullRequestNr, gitRepoName, gitRepoOwner) {
  try {
    const { data: protection } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner: gitRepoOwner,
        repo: gitRepoName,
        pull_number: pullRequestNr
      }
    );

    // check if the pull request can be merged
    if (protection.mergeable_state !== "clean") {
      return {
        status: false,
        message:
          "This pull request cannot be merged because it does not meet the requirements."
      };
    }

    // check if the pull request is open
    if (protection.state !== "open") {
      return {
        status: false,
        message: "Pull Request is not OPEN and cannot be merged."
      };
    }

    // check if the pull request has been approved
    const isApproved = await hasPullRequestBeenApproved(
      pullRequestNr,
      gitRepoName,
      gitRepoOwner
    );
    if (!isApproved) {
      return {
        status: false,
        message: "Pull request has not been approved yet."
      };
    }

    return { status: true, message: "pull request is ready to merge" };
  } catch (error) {
    throw new Error(`Failed to check pull request: ${error.message}`);
  }
}

/**
 *  Merges the pull request with the given number for the given repository
 * @param {number} pullRequestNr
 * @param {string} gitRepoName
 * @param {string} gitRepoOwner
 * @returns {object} {status: string, message: string, data: object}
 */
async function mergePullRequest(pullRequestNr, gitRepoName, gitRepoOwner) {
  try {
    // Check if the pull request meets all necessary requirements
    const canMerge = await canMergePullRequest(
      pullRequestNr,
      gitRepoName,
      gitRepoOwner
    );

    if (!canMerge.status) {
      // Comment on the pull request
      const prComment = `This pull request cannot be merged because it does not meet the requirements.`;
      await postCommentOnPullRequest(
        pullRequestNr,
        gitRepoName,
        gitRepoOwner,
        prComment
      );
      return {
        status: "error",
        message: canMerge.message
      };
    }

    // Merge the pull request
    const { data: merge } = await octokit.request(
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
      {
        owner: gitRepoOwner,
        repo: gitRepoName,
        pull_number: pullRequestNr,
        merge_method: "squash"
      }
    );

    // Check if the pull request has been merged
    if (merge.merged) {
      return {
        status: "success",
        message: "Pull request successfully merged",
        data: merge
      };
    }
    return {
      status: "error",
      message: "Pull Request could not merge for unknown reason.",
      data: merge
    };
  } catch (error) {
    throw new Error(`Failed to merge pull request: ${error.message}`);
  }
}

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
