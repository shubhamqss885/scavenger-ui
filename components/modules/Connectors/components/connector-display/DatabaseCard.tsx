"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

type DatabaseCardProps = {
  name: string;
  description: string;
  logoSrc: string;
  logoHeight: string;
  status: "live" | "coming_soon";
  index?: number;
  onClick?: () => void;
};

const getLogoHeightClass = (logoHeight: string): string => {
  if (logoHeight === "h-8") return "h-5";
  if (logoHeight === "h-7") return "h-[18px]";

  return "h-4";
};

export const DatabaseCard = ({
  name,
  description,
  logoSrc,
  logoHeight,
  status,
  index = 0,
  onClick,
}: Readonly<DatabaseCardProps>) => {
  const { t } = useTranslation("connectors");
  const isLive = status === "live";

  if (!isLive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        className="rounded-xl relative flex cursor-not-allowed select-none flex-col items-center gap-2.5 border border-dashed border-border/60 p-4 opacity-45"
        title={t("card.comingSoonTooltip")}
      >
        <span className="absolute right-2 top-2 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          {t("card.comingSoonBadge")}
        </span>
        <div className="rounded-xl flex h-11 w-11 items-center justify-center bg-muted/40">
          <Image
            src={logoSrc}
            alt={name}
            width={32}
            height={32}
            className={cn(
              "w-auto object-contain grayscale",
              getLogoHeightClass(logoHeight),
            )}
            unoptimized
          />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">{name}</p>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground/60">
            {description}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
        "group flex flex-col items-center gap-2.5 rounded-sm border border-border bg-card p-4",
        "text-center transition-all duration-150",
        "hover:border-primary",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      )}
    >
      <div className="rounded-xl flex h-11 w-11 items-center justify-center bg-muted/50">
        <Image
          src={logoSrc}
          alt={name}
          width={32}
          height={32}
          className={cn(
            "w-auto object-contain",
            getLogoHeightClass(logoHeight),
          )}
          unoptimized
        />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{name}</p>
        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.button>
  );
};
