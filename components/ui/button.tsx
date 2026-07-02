import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm leading-6 font-medium transition-colors focus-visible:outline-none focus-visible:bg-slate-200 disabled:pointer-events-none disabled:opacity-50 ",
  {
    variants: {
      variant: {
        default: "hover:bg-teal-400 bg-primary text-white",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "hover:bg-slate-100 bg-slate-100 shadow-sm",
        ghost: "hover:bg-accent text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        active: " ",
        dark: "bg-slate-900 hover:bg-slate-700 text-white rounded-lg",
        warning:
          "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs font-medium",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
