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

module.exports = {
  isTicketInPrTitle
};
