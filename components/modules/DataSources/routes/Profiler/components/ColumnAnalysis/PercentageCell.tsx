import { Progress } from "@/components/ui/progress";
import { Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { formatPercentage, PROGRESS_BAR_SIZE } from "../../utils";

type PercentageCellProps = Readonly<{
  value: number;
  indicatorClassName?: string;
}>;

export const PercentageCell = ({
  value,
  indicatorClassName,
}: PercentageCellProps) => (
  <td className="px-4 py-3 whitespace-nowrap">
    <div className="space-y-1">
      <Small className="text-foreground tabular-nums">
        {formatPercentage(value)}
      </Small>
      <Progress
        value={Math.min(value, 100)}
        className={cn(PROGRESS_BAR_SIZE, "bg-muted/50", indicatorClassName)}
      />
    </div>
  </td>
);
