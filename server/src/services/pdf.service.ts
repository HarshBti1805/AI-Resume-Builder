import puppeteer, { Browser } from "puppeteer";
import genericPool, { Pool } from "generic-pool";
import logger from "../utils/logger";

// ─────────────────────────────────────────────
// Browser pool — avoids cold-start cost per request
// ─────────────────────────────────────────────

const browserPool: Pool<Browser> = genericPool.createPool(
  {
    create: async (): Promise<Browser> =>
      puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--font-render-hinting=none",
        ],
      }),
    destroy: async (browser: Browser): Promise<void> => {
      await browser.close();
    },
  },
  {
    max: 5,           // max concurrent browsers
    min: 1,           // keep 1 warm at all times
    idleTimeoutMillis: 60_000,
    acquireTimeoutMillis: 30_000,
  }
);

browserPool.on("factoryCreateError", (err) => {
  logger.error("Browser pool create error", { err });
});

// ─────────────────────────────────────────────
// generatePdf
// Renders HTML string → A4 PDF buffer
// ─────────────────────────────────────────────

export const generatePdf = async (html: string): Promise<Buffer> => {
  const browser = await browserPool.acquire();

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 15_000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    await page.close();
    return Buffer.from(pdf);
  } finally {
    await browserPool.release(browser);
  }
};

// ─────────────────────────────────────────────
// drainBrowserPool — call from graceful shutdown
// ─────────────────────────────────────────────

export const drainBrowserPool = async (): Promise<void> => {
  try {
    await browserPool.drain();
    await browserPool.clear();
    logger.info("Browser pool drained");
  } catch (err) {
    logger.error("Error draining browser pool", { err });
  }
};