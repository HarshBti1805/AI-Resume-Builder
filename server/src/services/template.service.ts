import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_DIR = path.join(__dirname, "../../templates");

// ── In-memory compiled template cache ────────
const cache = new Map<string, HandlebarsTemplateDelegate>();

const getTemplate = async (name: string): Promise<HandlebarsTemplateDelegate> => {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const filePath = path.join(TEMPLATE_DIR, `${key}.hbs`);
  const source = await fs.readFile(filePath, "utf-8");
  const compiled = Handlebars.compile(source);
  cache.set(key, compiled);
  return compiled;
};

// ── Helpers ───────────────────────────────────

// "Jan 2024" or "Present"
Handlebars.registerHelper(
  "fmtDate",
  (date: string | Date | null | undefined): string => {
    if (!date) return "Present";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
);

// "2024"
Handlebars.registerHelper(
  "fmtYear",
  (date: string | Date | null | undefined): string => {
    if (!date) return "";
    return String(new Date(date).getFullYear());
  }
);

// join array with separator, default " • "
Handlebars.registerHelper(
  "join",
  (arr: unknown, sep: unknown): string => {
    if (!Array.isArray(arr)) return "";
    return arr.join(typeof sep === "string" ? sep : " • ");
  }
);

// block helper: render block only if array has items
Handlebars.registerHelper(
  "ifNotEmpty",
  function (this: unknown, arr: unknown[], options: Handlebars.HelperOptions) {
    return Array.isArray(arr) && arr.length > 0
      ? options.fn(this)
      : options.inverse(this);
  }
);

// block helper: render block only if value is truthy
Handlebars.registerHelper(
  "ifVal",
  function (this: unknown, val: unknown, options: Handlebars.HelperOptions) {
    return val ? options.fn(this) : options.inverse(this);
  }
);

// ── Main export ───────────────────────────────

export const renderTemplate = async (
  templateType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resumeData: Record<string, any>
): Promise<string> => {
  const tpl = await getTemplate(String(templateType));
  return tpl(resumeData);
};