"use client";

import {
  useState,
  forwardRef,
  ElementRef,
  ComponentPropsWithoutRef,
  useEffect,
} from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Small, Detail } from "@/components/ui/typography";

import { cn } from "@/lib/utils";

const Battery = forwardRef<
  ElementRef<typeof ProgressPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setLocalValue(100);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setLocalValue(value);
  };

  const getTextColor = (index: number, totalCharactors: number) => {
    if (!localValue) return "text-white";

    const progressPercentage = (localValue / 100) * totalCharactors;
    return index < progressPercentage ? "text-white" : "text-primary";
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-8 w-full overflow-hidden rounded-full bg-secondary-foreground",
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-36 flex-1 bg-primary transition-all p-3"
          style={{ transform: `translateX(-${100 - (localValue || 0)}%)` }}
        />
        {isHovered ? (
          <Small className="absolute mx-auto w-fit inset-0 flex items-center justify-center font-semibold text-white cursor-pointer">
            Upgrade
          </Small>
        ) : (
          <Detail
            className="absolute mx-auto w-fit inset-0 flex items-center justify-center font-semibold text-transparent bg-clip-text"
            style={{
              backgroundImage: `linear-gradient(to right, white ${localValue}%, #0b8785 ${localValue}%)`,
            }}
          >
            Credits Left: {localValue} / 100
          </Detail>
        )}
      </ProgressPrimitive.Root>
    </div>
  );
});
Battery.displayName = ProgressPrimitive.Root.displayName;

export { Battery };
