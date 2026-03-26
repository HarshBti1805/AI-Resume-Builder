import crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";

const execAsync = promisify(exec);

// ─────────────────────────────────────────────
// generateDocx
// Convert HTML (resume template) -> DOCX using `pandoc`.
// ─────────────────────────────────────────────
export const generateDocx = async (html: string): Promise<Buffer> => {
  const id = crypto.randomBytes(6).toString("hex");
  const tmpHtml = path.join(os.tmpdir(), `resume-${id}.html`);
  const tmpDocx = path.join(os.tmpdir(), `resume-${id}.docx`);

  try {
    await writeFile(tmpHtml, html, "utf8");

    // Pandoc can convert HTML -> DOCX directly.
    await execAsync(`pandoc "${tmpHtml}" -f html -t docx -o "${tmpDocx}"`);

    return await readFile(tmpDocx);
  } finally {
    await unlink(tmpHtml).catch(() => {});
    await unlink(tmpDocx).catch(() => {});
  }
};

