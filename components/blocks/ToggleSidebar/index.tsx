import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const ToggleSidebar = ({ className }: { className?: string }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      className={cn(
        "mr-2 h-8 w-8 px-2.5 opacity-100 sidebar-breakpoint:mr-0 sidebar-breakpoint:w-0 sidebar-breakpoint:overflow-hidden sidebar-breakpoint:px-0 sidebar-breakpoint:opacity-0",
        className,
      )}
      onClick={() => toggleSidebar()}
    >
      <Icon
        name="PanelRightClose"
        variant="foreground"
        className="h-8 w-4 min-w-4"
      />
    </Button>
  );
};

export default ToggleSidebar;
