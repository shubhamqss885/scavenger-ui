"use client";
import React from "react";
interface ThemeVariables {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-background": string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  radius: string;
  [key: string]: string;
}

const isThemeVariables = (
  obj: Record<string, string>,
): obj is ThemeVariables => {
  const requiredKeys: (keyof ThemeVariables)[] = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-background",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
    "radius",
  ];
  return requiredKeys.every((key) => typeof obj[key] === "string");
};

const themeVariables = {
  light: `
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 222.2 84% 4.9%;
      --primary: 176, 82%, 39%; /* Adjusted to #12B6AA */
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96.1%; /* adjusted to slate-100 #f1f5f9 */
      --secondary-foreground: 222.2,47.4%,11.2%; /* adjusted to slate-900 #0F172A */
      --muted: 210 40% 96.1%;
      --muted-background: 0 0% 98%;
      --muted-foreground: 215.4,16.3%,46.9%;
      --accent: 210 40% 96.1%;
      --accent-foreground: 222.2 47.4% 11.2%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 0, 0%, 92%;
      --input: 214.3 31.8% 91.4%;
      --ring: 178.8 85.4% 28.6%; /* Adjusted to #0E817B */
      --radius: 0.5rem;
    }
  `,
  dark: `
    .dark {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
      --card: 222.2 84% 4.9%;
      --card-foreground: 210 40% 98%;
      --popover: 222.2 84% 4.9%;
      --popover-foreground: 210 40% 98%;
      --primary: 178.4 72.2% 48.6%; /* Adjusted to #16DAD0 */
      --primary-foreground: 222.2 47.4% 11.2%;
      --secondary: 217.2 32.6% 17.5%;
      --secondary-foreground: 210 40% 98%;
      --muted: 217.2 32.6% 17.5%;
      --muted-background: 217.2,32.6%,17.5%;
      --muted-foreground: 215 20.2% 65.1%;
      --accent: 217.2 32.6% 17.5%;
      --accent-foreground: 210 40% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 210 40% 98%;
      --border: 217.2 32.6% 17.5%;
      --input: 217.2 32.6% 17.5%;
      --ring: 178.4 72.2% 48.6%; /* Adjusted to #16DAD0 */
      --radius: 0.5rem;
    }
  `,
};

const parseThemeVariables = (cssString: string): Record<string, string> => {
  const regex = /--([a-zA-Z-]+):\s*([^;]+);/g;
  const variables: Record<string, string> = {};
  let match;
  while ((match = regex.exec(cssString)) !== null) {
    variables[match[1]] = match[2].trim();
  }
  return variables;
};

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getTailwindColor = (hex: string): string => {
  type TailwindColors = {
    [key: string]: string;
    "#000000": string;
    "#ffffff": string;
    "#f8fafc": string;
    "#f1f5f9": string;
    "#e2e8f0": string;
    "#cbd5e1": string;
    "#94a3b8": string;
    "#64748b": string;
    "#475569": string;
    "#334155": string;
    "#1e293b": string;
    "#0f172a": string;
    "#020617": string;
  };
  const tailwindColors: TailwindColors = {
    "#000000": "black",
    "#ffffff": "white",
    "#f8fafc": "slate-50",
    "#f1f5f9": "slate-100",
    "#e2e8f0": "slate-200",
    "#cbd5e1": "slate-300",
    "#94a3b8": "slate-400",
    "#64748b": "slate-500",
    "#475569": "slate-600",
    "#334155": "slate-700",
    "#1e293b": "slate-800",
    "#0f172a": "slate-900",
    "#020617": "slate-950",
    // Add more Tailwind color mappings here
  };
  return tailwindColors[hex.toLowerCase()] || "";
};
const ColorSwatch = ({
  colorName,
  colorValue,
  isDark = false,
}: {
  colorName: string;
  colorValue: string;
  isDark?: boolean;
}) => {
  const parseHSL = (hslString: string) => {
    const values = hslString.replace(/,/g, " ").split(/\s+/);
    return values.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
  };

  const [h, s, l] = parseHSL(colorValue);
  let hexColor = "#000000";
  let backgroundColor = "transparent";

  try {
    if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
      hexColor = hslToHex(h, s, l);
      backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    } else {
      console.warn(`Invalid HSL value for ${colorName}: ${colorValue}`);
    }
  } catch (error) {
    console.error(`Error processing color ${colorName}: ${error}`);
  }

  const tailwindColor = getTailwindColor(hexColor);
  const textColor = isDark ? "text-white" : "text-black";

  return (
    <div className="mb-4 flex items-center gap-4">
      <div className="flex items-center mb-2">
        <div
          className={`w-16 h-16 mr-4 border rounded`}
          style={{ backgroundColor }}
        ></div>
      </div>
      <div className={`text-sm ${textColor}`}>
        <p className="font-bold">{colorName}</p>
        <p>HSL: {colorValue}</p>
        <p>HEX: {hexColor}</p>
        {tailwindColor && <p>Tailwind: {tailwindColor}</p>}
      </div>
    </div>
  );
};
const ColorInfo = ({
  colorName,
  colorValue,
  isDark = false,
}: {
  colorName: string;
  colorValue: string;
  isDark?: boolean;
}) => {
  const parseHSL = (hslString: string) => {
    const values = hslString.replace(/,/g, " ").split(/\s+/);
    return values.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
  };

  const [h, s, l] = parseHSL(colorValue);
  let hexColor = "#000000";
  let backgroundColor = "transparent";

  try {
    if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
      hexColor = hslToHex(h, s, l);
      backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    } else {
      console.warn(`Invalid HSL value for ${colorName}: ${colorValue}`);
    }
  } catch (error) {
    console.error(`Error processing color ${colorName}: ${error}`);
  }

  const tailwindColor = getTailwindColor(hexColor);
  const textColor = isDark ? "text-white" : "text-black";

  return (
    <div className={`text-sm ${textColor}`}>
      <p className="font-bold">{colorName}</p>
      <p>HSL: {colorValue}</p>
      <p>HEX: {hexColor}</p>
      {tailwindColor && <p>Tailwind: {tailwindColor}</p>}
    </div>
  );
};

const OtherThemeVariables = ({
  theme,
  isDark = false,
}: {
  theme: ThemeVariables;
  isDark?: boolean;
}) => (
  <div className={isDark ? "dark" : ""}>
    <h3 className="text-xl font-bold mt-8 mb-4">Other Theme Variables</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className={`${isDark ? "dark:border" : "border"} p-4`}>
        <ColorInfo
          colorName="Border"
          colorValue={theme.border}
          isDark={isDark}
        />
      </div>
      <div className={`${isDark ? "dark:bg-input" : "bg-input"} p-4`}>
        <ColorInfo
          colorName="Input Background"
          colorValue={theme.input}
          isDark={isDark}
        />
      </div>
      <div className={`ring-2 ${isDark ? "dark:ring-ring" : "ring-ring"} p-4`}>
        <ColorInfo
          colorName="Ring Color"
          colorValue={theme.ring}
          isDark={isDark}
        />
      </div>
      <div className="rounded-lg border p-4">
        Border Radius - lg -<strong>8px</strong> (0.5rem)
      </div>
      <div className="rounded-md border p-4">
        Border Radius - md -<strong>6px</strong> (0.5rem - 2px)
      </div>
      <div className="rounded-sm border p-4">
        Border Radius - sm -<strong>4px</strong> (0.5rem - 4px)
      </div>
    </div>
  </div>
);

const ThemeSection = ({
  theme,
  title,
  isDark = false,
}: {
  theme: ThemeVariables;
  title: string;
  isDark?: boolean;
}) => {
  const excludedVariables = ["border", "input", "ring", "radius"];
  const filteredTheme = Object.fromEntries(
    Object.entries(theme).filter(([key]) => !excludedVariables.includes(key)),
  ) as Partial<ThemeVariables>;

  return (
    <div className={isDark ? "dark bg-gray-900 text-white p-4 rounded-lg" : ""}>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(filteredTheme).map(
          ([name, value]) =>
            value && (
              <ColorSwatch
                key={name}
                colorName={name}
                colorValue={value}
                isDark={isDark}
              />
            ),
        )}
      </div>
      <OtherThemeVariables theme={theme} isDark={isDark} />
    </div>
  );
};

const ThemeDisplayDirectComplete = () => {
  const parseLightTheme = parseThemeVariables(themeVariables.light);
  const parseDarkTheme = parseThemeVariables(themeVariables.dark);

  const lightTheme: ThemeVariables | null = isThemeVariables(parseLightTheme)
    ? parseLightTheme
    : null;
  const darkTheme: ThemeVariables | null = isThemeVariables(parseDarkTheme)
    ? parseDarkTheme
    : null;

  if (!lightTheme || !darkTheme) {
    return <div>Error: Invalid theme configuration</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Your Theme Colors</h1>
      <ThemeSection theme={lightTheme} title="Light Mode Colors" />
      <div className="mt-8">
        <ThemeSection
          theme={darkTheme}
          title="Dark Mode Colors"
          isDark={true}
        />
      </div>
    </div>
  );
};

export default ThemeDisplayDirectComplete;
