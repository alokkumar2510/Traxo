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
 * Extracts a CSS section from HTML and returns its raw text
 */
export function extractSection(html: string, selector: string): string {
  const $ = cheerio.load(html);
  const element = $(selector);
  
  if (element.length === 0) {
    throw new Error(`Selector "${selector}" was not found in the HTML document.`);
  }

  return element.text();
}

/**
 * Extracts numeric price value using regex matching
 */
export function extractPrice(text: string): number | null {
  // Try pattern matching for currencies: e.g. ₹ 84,999.00 or $1,250
  const regex = /(?:₹|\$|inr|rs\.?|usd)\s*([0-9,]+(?:\.[0-9]+)?)/i;
  const match = text.match(regex);
  if (match) {
    const cleanNum = match[1].replace(/,/g, "");
    return parseFloat(cleanNum);
  }

  // Fallback: extract first numeric block
  const fallbackRegex = /([0-9,]+(?:\.[0-9]+)?)/;
  const fallbackMatch = text.match(fallbackRegex);
  if (fallbackMatch) {
    const cleanNum = fallbackMatch[1].replace(/,/g, "");
    return parseFloat(cleanNum);
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

  // Search anchors (links) which represent job postings typically
  $("a").each((_, el) => {
    const text = normalizeText($(el).text());
    const href = $(el).attr("href");

    if (text.length > 5 && text.length < 120) {
      const matchesKeyword = kwLower.some((k) => text.toLowerCase().includes(k));
      if (matchesKeyword && !seenTitles.has(text.toLowerCase())) {
        seenTitles.add(text.toLowerCase());
        
        // Inspect parent container text to find location
        const containerText = $(el).parent().text().toLowerCase();
        let location = "";
        
        if (containerText.includes("remote") || containerText.includes("work from home")) {
          location = "Remote";
        } else if (options.location) {
          // Check if parent text contains the targeted location name
          const locMatch = containerText.includes(options.location.toLowerCase());
          if (locMatch) {
            location = options.location;
          }
        }

        // Apply filters
        if (options.remoteOnly && location !== "Remote") {
          return;
        }

        if (options.location && location === "") {
          // Check if the link itself contains location text
          if (!text.toLowerCase().includes(options.location.toLowerCase())) {
            return;
          }
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
