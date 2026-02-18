/**
 * Extracts dollar amounts from a string.
 * Handles: $49, $49.99, $1,234.56, $49/mo, "$ 49.99"
 *
 * @param {string} text
 * @returns {number} Sum of all dollar amounts found, or 0
 */
function parseDollarAmount(text) {
  if (!text) return 0;

  const regex = /\$\s?([\d,]+(?:\.\d{1,2})?)/g;
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) return 0;

  let total = 0;
  for (const match of matches) {
    const cleaned = match[1].replace(/,/g, '');
    const amount = parseFloat(cleaned);
    if (!isNaN(amount)) {
      total += amount;
    }
  }

  return Math.round(total * 100) / 100;
}

module.exports = { parseDollarAmount };
