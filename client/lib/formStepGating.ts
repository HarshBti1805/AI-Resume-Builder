import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Achievement,
  Internship,
  Project,
} from "@/store/resumeStore";

const trim = (s: string | undefined) => (s ?? "").trim();

export function isStep1Complete(s: Step1Data): boolean {
  if (!trim(s.fullName)) return false;
  if (!trim(s.phone)) return false;
  const email = trim(s.contactEmail);
  if (!email) return false;
  if (!email.includes("@")) return false;
  return true;
}

export function isStep2Complete(s: Step2Data): boolean {
  if (!trim(s.university)) return false;
  if (!trim(s.stream)) return false;
  if (!trim(s.branch)) return false;
  if (!trim(s.cgpa)) return false;
  return true;
}

function projectHasAnyContent(p: Project): boolean {
  return (
    trim(p.title).length > 0 ||
    trim(p.subtitle).length > 0 ||
    trim(p.description).length > 0 ||
    (p.techStack?.length ?? 0) > 0 ||
    trim(p.liveUrl).length > 0 ||
    trim(p.repoUrl).length > 0 ||
    (p.bullets ?? []).some((b) => trim(b.text).length > 0)
  );
}

function isProjectComplete(p: Project): boolean {
  if (!trim(p.title)) return false;
  return (p.bullets ?? []).some((b) => trim(b.text).length > 0);
}

export function isStep3Complete(s: Step3Data): boolean {
  const hasSkill =
    (s.skillCategories ?? []).some(
      (c) => trim(c.name).length > 0 && (c.skills ?? []).some((sk) => trim(sk).length > 0)
    );
  if (!hasSkill) return false;

  const projects = s.projects ?? [];
  if (!projects.some((p) => isProjectComplete(p))) return false;
  return projects.every((p) => !projectHasAnyContent(p) || isProjectComplete(p));
}

function internshipHasAnyContent(i: Internship): boolean {
  return (
    trim(i.company).length > 0 ||
    trim(i.role).length > 0 ||
    trim(i.description).length > 0 ||
    trim(i.startDate).length > 0 ||
    trim(i.endDate).length > 0 ||
    (i.bullets ?? []).some((b) => trim(b.text).length > 0)
  );
}

function isInternshipComplete(i: Internship): boolean {
  return trim(i.company).length > 0 && trim(i.role).length > 0;
}

function achievementHasAnyContent(a: Achievement): boolean {
  return (
    trim(a.title).length > 0 ||
    trim(a.description).length > 0 ||
    trim(a.link).length > 0
  );
}

function isAchievementComplete(a: Achievement): boolean {
  return trim(a.title).length > 0;
}

export function isStep4Complete(s: Step4Data): boolean {
  for (const i of s.internships ?? []) {
    if (internshipHasAnyContent(i) && !isInternshipComplete(i)) return false;
  }
  for (const a of s.achievements ?? []) {
    if (achievementHasAnyContent(a) && !isAchievementComplete(a)) return false;
  }
  return true;
}

/** First step (1–4) that blocks access to later form routes; `null` if steps 1–4 are satisfied. */
export function getFirstBlockingFormStep(
  step1: Step1Data,
  step2: Step2Data,
  step3: Step3Data,
  step4: Step4Data
): 1 | 2 | 3 | 4 | null {
  if (!isStep1Complete(step1)) return 1;
  if (!isStep2Complete(step2)) return 2;
  if (!isStep3Complete(step3)) return 3;
  if (!isStep4Complete(step4)) return 4;
  return null;
}

/** Highest step index (0-based) the user may open in the form wizard. */
export function getMaxAllowedFormStepIndex(
  step1: Step1Data,
  step2: Step2Data,
  step3: Step3Data,
  step4: Step4Data
): number {
  const first = getFirstBlockingFormStep(step1, step2, step3, step4);
  if (first === null) return 4;
  return Math.max(0, first - 1);
}
