import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const messageBubbleVariants = cva("rounded-md p-2.5 text-sm", {
  variants: {
    variant: {
      user: "max-w-[85%] bg-primary text-primary-foreground w-fit",
      agent:
        "flow-root p-0 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
      clarification:
        "border border-amber-300 bg-amber-50 py-1 text-slate-900 dark:border-amber-600 dark:bg-amber-950 dark:text-slate-100",
    },
  },
  defaultVariants: {
    variant: "agent",
  },
});

type MessageBubbleProps = Readonly<{
  variant: NonNullable<VariantProps<typeof messageBubbleVariants>["variant"]>;
  className?: string;
  children: React.ReactNode;
}>;

const MessageBubble = ({
  variant,
  className,
  children,
}: MessageBubbleProps) => {
  return (
    <div className={cn(messageBubbleVariants({ variant }), className)}>
      {children}
    </div>
  );
};

export { MessageBubble };
