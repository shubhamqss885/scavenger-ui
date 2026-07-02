"use client";

import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/client";

export type ExampleType = "rules" | "goldenQueries" | "documents";

const TILE_ICONS: Record<ExampleType, "Scale" | "Star" | "FileText"> = {
  rules: "Scale",
  goldenQueries: "Star",
  documents: "FileText",
};

type Props = Readonly<{
  onShowExample: (type: ExampleType) => void;
}>;

export const VaultIntro = ({ onShowExample }: Props) => {
  const { t } = useTranslation("database");

  const tiles: ExampleType[] = ["rules", "goldenQueries", "documents"];

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-8 sm:pt-16">
      <p className="mb-1 text-sm font-medium text-muted-foreground">
        {t("vault.introTitle")}
      </p>
      <p className="mb-8 text-xs text-muted-foreground/70">
        {t("vault.introDesc")}
      </p>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div
            key={tile}
            className="flex flex-col rounded-lg border bg-card p-4"
          >
            <Icon
              name={TILE_ICONS[tile]}
              size="md"
              className="mb-2 text-muted-foreground"
            />
            <p className="mb-1 text-sm font-medium">
              {t(`vault.tiles.${tile}.title`)}
            </p>
            <p className="mb-3 flex-1 text-xs text-muted-foreground">
              {t(`vault.tiles.${tile}.desc`)}
            </p>
            <button
              onClick={() => onShowExample(tile)}
              className="self-start text-xs font-medium text-primary hover:underline"
            >
              {t(`vault.tiles.${tile}.cta`)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
