import { Button } from "@/components/ui/button";
import { H4 } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import ToggleSidebar from "../ToggleSidebar";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  refreshLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  onBack,
  onRefresh,
  refreshDisabled,
  refreshLoading,
  className,
  children,
}: PageHeaderProps) => {
  return (
    <div
      className={cn(
        "mb-6 flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-slate-400 pb-2.5 pt-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start">
        <ToggleSidebar />
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-1.5 px-2"
          >
            <Icon name="ArrowLeft" size="xs" variant="foreground" />
          </Button>
        )}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center">
            <H4 className="mr-1.5 leading-8">{title}</H4>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                disabled={refreshDisabled}
                onClick={onRefresh}
              >
                <Icon
                  name="RefreshCw"
                  size="xs"
                  className={refreshLoading ? "animate-spin" : ""}
                />
              </Button>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex grow flex-wrap items-center justify-center gap-2 self-center sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
