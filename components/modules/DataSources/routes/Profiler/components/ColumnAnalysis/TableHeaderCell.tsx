import { ReactNode } from "react";
import { Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type TableHeaderCellProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export const TableHeaderCell = ({
  children,
  className,
}: TableHeaderCellProps) => (
  <th className={cn("px-4 py-3 text-left", className)}>
    <Small className="font-medium text-muted-foreground">{children}</Small>
  </th>
);
