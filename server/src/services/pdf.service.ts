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
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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
    validate: async (browser: Browser): Promise<boolean> =>
      Promise.resolve(browser.connected),
  },
  {
    max: 5,
    // Keep startup resilient on platforms where Chrome may not be present yet.
    min: 0,
    idleTimeoutMillis: 60_000,
    acquireTimeoutMillis: 30_000,
    testOnBorrow: true,
  }
);

browserPool.on("factoryCreateError", (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error("Browser pool create error", { message, stack, raw: err });
});

// ─────────────────────────────────────────────
// generatePdf
// Renders HTML string → A4 PDF buffer
// ─────────────────────────────────────────────

const isConnectionError = (err: unknown): boolean =>
  err instanceof Error &&
  (err.name === "ConnectionClosedError" || /connection closed/i.test(err.message));

export const generatePdf = async (html: string): Promise<Buffer> => {
  const tryGenerate = async (): Promise<Buffer> => {
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
      browserPool.release(browser);
      return Buffer.from(pdf);
    } catch (err) {
      if (isConnectionError(err)) {
        await browserPool.destroy(browser);
        throw err;
      }
      browserPool.release(browser);
      throw err;
    }
  };

  try {
    return await tryGenerate();
  } catch (err) {
    if (isConnectionError(err)) {
      logger.warn("Browser connection lost, retrying PDF generation once");
      return await tryGenerate();
    }
    throw err;
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