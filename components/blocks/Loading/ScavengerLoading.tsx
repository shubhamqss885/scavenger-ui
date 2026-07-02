import { Icon } from "@/components/ui/icon";
import { IconLogoWordmark } from "@/lib/icons/logo-wordmark";
import React from "react";

const ScavengerLoading = () => {
  return (
    <div className="fixed inset-0 z-50 flex h-svh flex-col items-center justify-center gap-4 bg-white px-4">
      <IconLogoWordmark className="h-10 w-auto text-slate-900 sm:h-12" />
      <Icon
        name="LoaderCircle"
        className="h-8 w-8 animate-spin sm:h-10 sm:w-10"
        variant="foreground"
      />
    </div>
  );
};

export default ScavengerLoading;
