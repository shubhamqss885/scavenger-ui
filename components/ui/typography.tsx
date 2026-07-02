import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

const H1 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => {
  return (
    <h1
      {...props}
      ref={ref}
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl lg:leading-none",
        props.className,
      )}
    >
      {props.children}
    </h1>
  );
});

H1.displayName = "H1";

export { H1 };

const H2 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => {
  return (
    <h2
      {...props}
      ref={ref}
      className={cn(
        "scroll-m-20 border-b pb-2 text-2xl font-semibold leading-8 tracking-tight first:mt-0",
        props.className,
      )}
    >
      {props.children}
    </h2>
  );
});

H2.displayName = "H2";

export { H2 };

const H3 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => {
  return (
    <h3
      {...props}
      ref={ref}
      className={cn(
        "scroll-m-20 text-xl font-semibold leading-7 tracking-tight",
        props.className,
      )}
    >
      {props.children}
    </h3>
  );
});

H3.displayName = "H3";

export { H3 };

const H4 = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => {
  return (
    <h4
      {...props}
      ref={ref}
      className={cn(
        "scroll-m-20 text-base font-semibold leading-6 tracking-tight",
        props.className,
      )}
    >
      {props.children}
    </h4>
  );
});

H4.displayName = "H4";

export { H4 };

const Lead = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>((props, ref) => {
  return (
    <p
      {...props}
      ref={ref}
      className={cn("text-xl text-muted-foreground", props.className)}
    >
      {props.children}
    </p>
  );
});

Lead.displayName = "Lead";

export { Lead };

const P = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>((props, ref) => {
  return (
    <p
      {...props}
      ref={ref}
      className={cn("text-xs leading-7 [&:first-child]:mt-6", props.className)}
    >
      {props.children}
    </p>
  );
});

P.displayName = "P";

export { P };

const Large = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>((props, ref) => {
  return (
    <p
      {...props}
      ref={ref}
      className={cn("text-base font-semibold leading-7", props.className)}
    >
      {props.children}
    </p>
  );
});

Large.displayName = "Large";

export { Large };

const Small = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { as?: "p" | "span" }
>(({ as: Tag = "p", ...props }, ref) => {
  return (
    <Tag
      {...props}
      ref={ref as React.Ref<never>}
      className={cn("text-xs font-medium leading-none", props.className)}
    >
      {props.children}
    </Tag>
  );
});

Small.displayName = "Small";

export { Small };

const Muted = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>((props, ref) => {
  return (
    <span
      {...props}
      ref={ref}
      className={cn("text-sm text-muted-foreground", props.className)}
    >
      {props.children}
    </span>
  );
});

Muted.displayName = "Muted";

export { Muted };

const Detail = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>((props, ref) => {
  return (
    <span
      {...props}
      ref={ref}
      // TODO: change to a variable if and when defined
      className={cn(
        "text-xs font-medium leading-5 text-slate-400",
        props.className,
      )}
    >
      {props.children}
    </span>
  );
});

Detail.displayName = "Detail";

export { Detail };

const InlineCode = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>((props, ref) => {
  return (
    <code
      {...props}
      ref={ref}
      className={cn(
        "rounded relative text-wrap bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold",
        props.className,
      )}
    >
      {props.children}
    </code>
  );
});

InlineCode.displayName = "InlineCode";

export { InlineCode };

const List = forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>((props, ref) => {
  return (
    <ul
      {...props}
      ref={ref}
      className={cn(
        "my-6 ml-6 list-disc text-xs leading-5 [&>li]:mt-2",
        props.className,
      )}
    >
      {props.children}
    </ul>
  );
});

List.displayName = "List";

export { List };

const Quote = forwardRef<
  HTMLQuoteElement,
  React.HTMLAttributes<HTMLQuoteElement>
>((props, ref) => {
  return (
    <blockquote
      {...props}
      ref={ref}
      className={cn(
        "mt-6 border-l-2 pl-6 text-xs italic leading-5 text-muted-foreground",
        props.className,
      )}
    >
      {props.children}
    </blockquote>
  );
});

Quote.displayName = "Quote";

export { Quote };

const Subtle = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>((props, ref) => {
  return (
    <span
      {...props}
      ref={ref}
      className={cn(
        "text-xs font-normal leading-4 text-slate-500",
        props.className,
      )}
    >
      {props.children}
    </span>
  );
});

Subtle.displayName = "Subtle";

export { Subtle };

const Chat = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>((props, ref) => {
  return (
    <p
      {...props}
      ref={ref}
      className={cn(
        "text-xs font-normal leading-7 text-slate-700",
        props.className,
      )}
    >
      {props.children}
    </p>
  );
});

Chat.displayName = "Chat";

export { Chat };
