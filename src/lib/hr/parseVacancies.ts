/**
 * Turns a vacancy message as clients send it on WhatsApp into requirement rows, e.g.
 *
 *   Folks Agra vacancy -
 *   Head chef
 *   Salary (50-70K) as per skills
 *   No accommodation
 *   Preferably continental cuisine background
 *
 *   Senior Stewards - 2
 *   Salary (15-18K)
 *
 * Group headers ("... vacancy -", "Folks Gurgaon -") become the outlet/location,
 * "Salary" and "accommodation" lines fill those fields, "- 2" sets the number of
 * openings, text in brackets and "Preferably…" lines become key skills.
 */
export interface ParsedVacancy {
  title: string;
  openings: number;
  location: string;
  salary_range: string;
  benefits: string;
  skills: string;
  department: string;
  level: string;
}

const NOTE_START = /^(preferab|prefer|must|should|requir|need|only|exp|background|age\b|male|female|immediate|urgent|candidate|knowledge|good|strong|fluent)/i;

const ABBREVIATIONS: Record<string, string> = {
  rm: "Restaurant Manager (RM)",
  arm: "Assistant Restaurant Manager (ARM)",
  gm: "General Manager (GM)",
  agm: "Assistant General Manager (AGM)",
  fom: "Front Office Manager (FOM)",
  gre: "Guest Relations Executive (GRE)",
  gsa: "Guest Service Associate (GSA)",
  cdp: "Chef de Partie (CDP)",
  dcdp: "Demi Chef de Partie (DCDP)",
  sous: "Sous Chef",
  hk: "Housekeeping",
};

export const guessDepartment = (title: string): string => {
  const t = title.toLowerCase();
  if (/chef|commi|cdp|cook|bakery|baker|pastry|kitchen|tandoor|halwai|kp\b/.test(t)) return "F&B Production";
  if (/steward|waiter|captain|server|bartender|bar\b|\brm\b|\barm\b|restaurant manager|f&b|banquet|host/.test(t)) return "F&B Service";
  if (/front office|reception|gre\b|gsa\b|concierge|bell|night audit|fom\b/.test(t)) return "Front Office";
  if (/housekeep|room attendant|\bhk\b|public area/.test(t)) return "Housekeeping";
  if (/laundry|linen/.test(t)) return "Laundry";
  if (/mainten|engineer|electric|plumb|technician|hvac|carpenter/.test(t)) return "Maintenance";
  return "";
};

export const guessLevel = (title: string): string => {
  const t = title.toLowerCase();
  if (/head|executive chef|\bgm\b|general manager|director|hod/.test(t)) return "Senior / HOD";
  if (/manager|\brm\b|\barm\b|sous|fom\b/.test(t)) return "Managerial";
  if (/supervisor|captain|cdp|senior|incharge|in-charge|team lead/.test(t)) return "Supervisory";
  if (/commi|steward|attendant|waiter|associate|helper|trainee|junior|kp\b/.test(t)) return "Junior / Entry";
  return "";
};

const cleanHeader = (line: string) =>
  line.replace(/vacanc(y|ies)/gi, "").replace(/[:\-–—]+\s*$/g, "").replace(/\s*[:\-–—]+\s*$/g, "").replace(/\s{2,}/g, " ").trim();

const isHeader = (line: string) => /vacanc(y|ies)/i.test(line) || /(:-|[:\-–—])\s*$/.test(line);

const cleanSalary = (line: string) =>
  line.replace(/^salary\s*/i, "").replace(/^[:\-–—]\s*/, "").replace(/[()]/g, "").replace(/\s{2,}/g, " ").trim();

const expandTitle = (raw: string) => {
  const key = raw.trim().toLowerCase();
  return ABBREVIATIONS[key] ?? raw.trim();
};

export const parseVacancies = (text: string): ParsedVacancy[] => {
  const out: ParsedVacancy[] = [];
  let location = "";
  let current: ParsedVacancy | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^[\s•*\-–·\d.)]+(?=[A-Za-z])/, "").trim();
    if (!line) continue;

    if (/^salary\b/i.test(line)) {
      if (current) current.salary_range = cleanSalary(line);
      continue;
    }
    if (/accomm?odation|accomodation|food\s*(&|and)\s*stay|stay\s*provided/i.test(line)) {
      if (current) current.benefits = current.benefits ? `${current.benefits}, ${line}` : line;
      continue;
    }
    if (isHeader(line) && !/\d\s*$/.test(line)) {
      location = cleanHeader(line);
      current = null;
      continue;
    }
    if (current && NOTE_START.test(line)) {
      current.skills = current.skills ? `${current.skills}; ${line}` : line;
      continue;
    }

    // A new position: "Senior Stewards - 2", "VDJ (Strong Rock n Retro background)".
    let title = line;
    let openings = 1;
    const count = title.match(/\s*(?:[-–:x×]|\bx)\s*(\d{1,3})\s*$/i) || title.match(/\s*\((\d{1,3})\)\s*$/);
    if (count) { openings = Math.max(1, parseInt(count[1], 10)); title = title.slice(0, count.index).trim(); }
    let skills = "";
    const bracket = title.match(/\(([^)]+)\)/);
    if (bracket) { skills = bracket[1].trim(); title = title.replace(bracket[0], "").trim(); }
    title = expandTitle(title.replace(/\s{2,}/g, " "));
    current = { title, openings, location, salary_range: "", benefits: "", skills, department: guessDepartment(title), level: guessLevel(title) };
    out.push(current);
  }
  return out;
};
