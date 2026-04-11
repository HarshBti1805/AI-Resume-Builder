import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_DIR = path.join(__dirname, "../../templates");

// ── In-memory compiled template cache ────────
const cache = new Map<string, HandlebarsTemplateDelegate>();

const getTemplate = async (name: string): Promise<HandlebarsTemplateDelegate> => {
  const key = name.toLowerCase();
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && cache.has(key)) return cache.get(key)!;

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

// eq: compare two values
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

// sectionTitle(sectionId): return custom title or default for section
const DEFAULT_SECTION_TITLES: Record<string, string> = {
  summary: "Professional Summary",
  education: "Education",
  skills: "Technical Skills",
  experience: "Experience",
  projects: "Projects",
  achievements: "Achievements",
  hobbies: "Interests",
};
Handlebars.registerHelper(
  "sectionTitle",
  function (this: unknown, sectionId: unknown, options: Handlebars.HelperOptions) {
    const root = options.data?.root as Record<string, unknown> | undefined;
    const titles = (root?.sectionTitles as Record<string, string>) || {};
    const id = String(sectionId ?? "");
    return titles[id] || DEFAULT_SECTION_TITLES[id] || id;
  }
);

// customSectionById(id): return custom section object for template use
Handlebars.registerHelper(
  "customSectionById",
  function (this: unknown, id: unknown, options: Handlebars.HelperOptions) {
    const root = options.data?.root as Record<string, unknown> | undefined;
    const byId = (root?.customSectionsById as Record<string, { title: string; items: { text: string }[] }>) || {};
    return byId[String(id ?? "")] || false;
  }
);

/** Internships with at least one field filled — omit empty placeholders from resume output. */
function internshipsWithUserContent(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item: Record<string, unknown>) => {
    const company = String(item.company ?? "").trim();
    const role = String(item.role ?? "").trim();
    const description = String(item.description ?? "").trim();
    const startDate = String(item.startDate ?? "").trim();
    const endDate = String(item.endDate ?? "").trim();
    const bullets = Array.isArray(item.bullets) ? item.bullets : [];
    const hasBullet = bullets.some((b) =>
      String((b as { text?: string })?.text ?? "").trim().length > 0
    );
    return (
      company.length > 0 ||
      role.length > 0 ||
      description.length > 0 ||
      hasBullet ||
      startDate.length > 0 ||
      endDate.length > 0
    );
  });
}

// ── Main export ───────────────────────────────

export const renderTemplate = async (
  templateType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resumeData: Record<string, any>
): Promise<string> => {
  const data = { ...resumeData };
  data.internships = internshipsWithUserContent(data.internships);
  const defaultOrder = [
    "summary",
    "education",
    "skills",
    "experience",
    "projects",
    "achievements",
    "hobbies",
  ];
  if (!data.sectionOrder || data.sectionOrder.length === 0) {
    data.sectionOrder = [...defaultOrder];
  }
  const customIds = (data.customSections || []).map((cs: { id: string }) => cs.id);
  customIds.forEach((id: string) => {
    if (!data.sectionOrder.includes(id)) data.sectionOrder.push(id);
  });
  if (!data.sectionTitles || typeof data.sectionTitles !== "object") {
    data.sectionTitles = {};
  }
  if (!data.customSectionsById && Array.isArray(data.customSections)) {
    data.customSectionsById = {};
    data.customSections.forEach((cs: { id: string; title: string; items: { text: string }[] }) => {
      data.customSectionsById[cs.id] = { title: cs.title, items: cs.items || [] };
    });
  }
  const tpl = await getTemplate(String(templateType));
  return tpl(data, { data: { root: data } });
};