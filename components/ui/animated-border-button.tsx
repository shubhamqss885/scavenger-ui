"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnimatedBorderButtonProps = Readonly<
  ButtonProps & {
    animated?: boolean;
  }
>;

const AnimatedBorderButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedBorderButtonProps
>(({ animated = false, children, className, ...props }, ref) => {
  return (
    <Button ref={ref} className={cn("relative", className)} {...props}>
      {animated && (
        <div
          className={cn(
            "pointer-events-none absolute -inset-px rounded-[inherit] border-2 border-transparent",
            "[mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
          )}
        >
          <motion.div
            className="absolute aspect-square bg-gradient-to-r from-transparent via-primary to-primary"
            animate={{
              offsetDistance: ["0%", "100%"],
            }}
            style={{
              width: 16,
              offsetPath: `rect(0 auto auto 0 round 16px)`,
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "linear",
            }}
          />
        </div>
      )}
      {children}
    </Button>
  );
});

AnimatedBorderButton.displayName = "AnimatedBorderButton";

export { AnimatedBorderButton };
