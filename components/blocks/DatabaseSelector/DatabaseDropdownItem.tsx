import { Icon } from "@/components/ui/icon";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { P } from "@/components/ui/typography";

type DatabaseDropdownItemProps = Readonly<{
  db: any;
  value: string;
  onChange: (databaseId: string) => void;
}>;

export const DatabaseDropdownItem = ({
  db,
  value,
  onChange,
}: DatabaseDropdownItemProps) => {
  return (
    <DropdownMenuItem
      key={db.orgdb_id}
      onClick={() => onChange(db.orgdb_id)}
      className="flex w-[190px] cursor-pointer items-center gap-1 truncate rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
    >
      <div className="flex h-4 w-4 min-w-4 items-center justify-center">
        {value === db.orgdb_id && (
          <Icon name="Check" size="xs" className="mt-0.5 text-slate-500" />
        )}
      </div>
      <P className="truncate text-xs font-medium text-slate-500">
        {db.display_name || db.orgdb_name_decrypted || "Database"}
      </P>
    </DropdownMenuItem>
  );
};
