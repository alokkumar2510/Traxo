import { chromium } from "playwright";
import { logger } from "@/utils/logger";

export interface BrowserPageResult {
  html: string;
  screenshot?: Buffer;
  status: number;
}

/**
 * Launches a headless browser to fetch and render dynamic pages
 */
export async function fetchWithPlaywright(
  url: string,
  options: { captureScreenshot?: boolean } = {}
): Promise<BrowserPageResult> {
  logger.info({
    service: "monitoring",
    event: "playwright_scrape_started",
    metadata: { url, captureScreenshot: !!options.captureScreenshot },
  });

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Navigate to URL and wait until network connections are idle
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000, // 30 seconds timeout limit
    });

    const status = response?.status() ?? 200;
    const html = await page.content();
    let screenshot: Buffer | undefined;

    if (options.captureScreenshot) {
      screenshot = await page.screenshot({ fullPage: true });
    }

    logger.info({
      service: "monitoring",
      event: "playwright_scrape_success",
      metadata: { url, status, htmlLength: html.length },
    });

    return { html, screenshot, status };
  } catch (error: any) {
    logger.error({
      service: "monitoring",
      event: "playwright_scrape_failed",
      metadata: { url },
      error: error.message || error,
    });
    throw error;
  } finally {
    await browser.close();
  }
}
