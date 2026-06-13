import * as cheerio from "cheerio";

/**
 * Normalizes text content by removing tabs, multiple spaces, and excess line breaks
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts only visible text from HTML, stripping <script>, <style>, <head>,
 * and other non-content tags. Prevents script nonces, CSS values, and other
 * volatile page internals from polluting the content hash.
 */
export function extractVisibleBodyText(html: string): string {
  const $ = cheerio.load(html);

  // Remove non-visible content
  $("script, style, head, noscript, iframe, svg, [aria-hidden='true']").remove();

  // Get the body text
  const bodyText = $("body").text();
  return normalizeText(bodyText);
}

/**
 * Extracts a CSS section from HTML and returns its raw text
 */
export function extractSection(html: string, selector: string): string {
  const $ = cheerio.load(html);
  const element = $(selector);

  if (element.length === 0) {
    throw new Error(`Selector "${selector}" was not found in the HTML document.`);
  }

  return normalizeText(element.text());
}

/**
 * Extracts numeric price value from visible page text.
 * Uses currency-anchored patterns first, falls back to context-aware extraction.
 * Returns null if no reliable price can be found (never returns garbage).
 */
export function extractPrice(html: string): number | null {
  // Load HTML and extract only visible text (exclude scripts, styles, etc.)
  const $ = cheerio.load(html);
  $("script, style, head, noscript").remove();
  const visibleText = normalizeText($("body").text());

  // Patterns ordered by specificity: currency-anchored first
  const currencyPatterns = [
    /(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:\$|USD)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:£|GBP)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:€|EUR)\s*([0-9,]+(?:\.[0-9]+)?)/i,
    // Number followed by currency symbol
    /([0-9,]+(?:\.[0-9]+)?)\s*(?:₹|Rs\.?|INR|\$|USD|£|€)/i,
  ];

  for (const pattern of currencyPatterns) {
    const match = visibleText.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ""));
      // Sanity check: prices should be between 0.01 and 100,000,000
      if (!isNaN(num) && num > 0.01 && num < 100_000_000) {
        return num;
      }
    }
  }

  // Context-aware fallback: look near price-indicating words
  const priceContextRegex = /(?:price|cost|amount|total|pay|mrp|offer|buy)[:\s₹$£€]*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const contextMatch = visibleText.match(priceContextRegex);
  if (contextMatch) {
    const num = parseFloat(contextMatch[1].replace(/,/g, ""));
    if (!isNaN(num) && num > 0.01 && num < 100_000_000) {
      return num;
    }
  }

  return null;
}

export interface ExtractedJob {
  title: string;
  link?: string;
  location?: string;
}

/**
 * Parses job listings matching keywords and filters
 */
export function extractJobs(
  html: string,
  keywords: string[],
  options: { location?: string; remoteOnly?: boolean } = {}
): ExtractedJob[] {
  const $ = cheerio.load(html);
  const listings: ExtractedJob[] = [];
  const seenTitles = new Set<string>();

  const kwLower = keywords.map((k) => k.toLowerCase());

  $("a").each((_, el) => {
    const text = normalizeText($(el).text());
    const href = $(el).attr("href");

    if (text.length > 5 && text.length < 120) {
      const matchesKeyword = kwLower.length === 0 || kwLower.some((k) => text.toLowerCase().includes(k));
      if (matchesKeyword && !seenTitles.has(text.toLowerCase())) {
        seenTitles.add(text.toLowerCase());

        const containerText = $(el).parent().text().toLowerCase();
        let location = "";

        if (containerText.includes("remote") || containerText.includes("work from home")) {
          location = "Remote";
        } else if (options.location && containerText.includes(options.location.toLowerCase())) {
          location = options.location;
        }

        if (options.remoteOnly && location !== "Remote") return;

        if (
          options.location &&
          location === "" &&
          !text.toLowerCase().includes(options.location.toLowerCase())
        ) {
          return;
        }

        listings.push({
          title: text,
          link: href,
          location: location || undefined,
        });
      }
    }
  });

  return listings;
}
