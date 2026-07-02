import { Project } from "@/lib/context/ProjectsContext/types";

const escapeRegExp = (string: string): string =>
  string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

// Default-name bases across locales. Add a new locale's `home.page.newProject`
// value here so cross-locale chats stay auto-name-eligible.
const DEFAULT_PROJECT_NAME_BASES = ["New Project", "Neues Projekt"] as const;

export const generateProjectName = (
  existingProjects: Project[],
  baseProjectName: string,
): string => {
  const projects = existingProjects ?? [];

  // Escape regex special characters to prevent injection
  const escapedBaseName = escapeRegExp(baseProjectName);

  // Match "Base Name" or "Base Name N" where N is a number
  const projectNameRegex = new RegExp(`^${escapedBaseName}(?: (\\d+))?$`);

  // Extract all numbers from existing project names
  const existingNumbers = projects
    .filter((project) => project.project_name?.startsWith(baseProjectName))
    .map((project) => {
      const match = project.project_name?.match(projectNameRegex);
      return match ? Number.parseInt(match[1] ?? "1", 10) : 0;
    })
    .filter((num) => !Number.isNaN(num));

  // If no numbered projects exist, start with 1
  if (existingNumbers.length === 0) {
    return `${baseProjectName} 1`;
  }

  // Find the highest number and increment
  const highestNumber = Math.max(...existingNumbers);
  return `${baseProjectName} ${highestNumber + 1}`;
};

// True if `name` matches any locale's default (e.g. "New Project 3",
// "Neues Projekt"). Locale-independent so a chat survives a UI language swap.
export const isDefaultProjectName = (
  name: string | undefined | null,
): boolean => {
  if (!name) return false;
  const alternatives = DEFAULT_PROJECT_NAME_BASES.map(escapeRegExp).join("|");
  return new RegExp(`^(?:${alternatives})(?: \\d+)?$`).test(name);
};
