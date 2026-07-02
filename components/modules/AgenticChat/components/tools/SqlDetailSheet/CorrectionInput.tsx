import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";

export const CorrectionInput = ({
  value,
  placeholder,
  disabled,
  onChange,
  onSubmit,
}: Readonly<{
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}>) => (
  <div className="flex items-end gap-2 rounded-md border border-sidebar-border bg-white p-2 pl-3 shadow-md dark:bg-slate-950">
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      className="h-10 min-h-[40px] resize-none overflow-hidden border-0 bg-transparent py-2.5 text-sm shadow-none focus-visible:ring-0"
      rows={1}
    />
    <Button
      size="icon"
      disabled={disabled}
      onClick={onSubmit}
      className="h-9 w-9 shrink-0"
    >
      <Icon name="ArrowUp" size="sm" className="text-white" />
    </Button>
  </div>
);
