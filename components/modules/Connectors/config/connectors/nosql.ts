import type { Connector } from "./types";

export const nosqlConnectors: Connector[] = [
  {
    id: "mongodb",
    name: "MongoDB",
    logoSrc: "/logos/databases/mongodb.svg",
    logoHeight: "h-8",
    status: "coming_soon",
    description: "Document-oriented NoSQL database",
    category: "nosql",
    dialect: "mongodb",
    fields: [
      {
        fields: [
          {
            name: "host",
            label: "Host",
            type: "text",
            required: true,
            placeholder: "cluster.mongodb.net",
          },
          {
            name: "port",
            label: "Port",
            type: "text",
            required: false,
            defaultValue: "27017",
          },
        ],
        gridCols: "grid-cols-[1fr_100px]",
      },
      { name: "database", label: "Database", type: "text", required: true },
      {
        fields: [
          {
            name: "username",
            label: "Username",
            type: "text",
            required: false,
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            required: false,
          },
        ],
      },
      {
        name: "authSource",
        label: "Auth Source",
        type: "text",
        required: false,
        placeholder: "admin",
        defaultValue: "admin",
      },
    ],
    buildUrl: (d) => {
      const auth = d.username
        ? `${encodeURIComponent(d.username)}:${encodeURIComponent(d.password)}@`
        : "";
      const authSource =
        d.authSource && d.authSource !== "admin"
          ? `?authSource=${d.authSource}`
          : "";
      return `mongodb://${auth}${d.host}:${d.port || "27017"}/${d.database}${authSource}`;
    },
    buildDisplayUrl: (d) => {
      const auth = d.username ? `${d.username}:***@` : "";
      return `mongodb://${auth}${d.host}:${d.port || "27017"}/${d.database}`;
    },
    pasteModePlaceholder:
      "mongodb://user:password@host:27017/mydb\nor: mongodb+srv://user:password@cluster.mongodb.net/mydb",
  },
];
