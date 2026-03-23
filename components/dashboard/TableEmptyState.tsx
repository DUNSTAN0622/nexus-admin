import { FolderIcon, SearchIcon } from "@/components/dashboard/icons";

type TableEmptyStateProps = {
  colSpan: number;
  hasSearch?: boolean;
  message?: string;
  hint?: string;
};

export default function TableEmptyState({
  colSpan,
  hasSearch = false,
  message = "目前尚無相符資料",
  hint,
}: TableEmptyStateProps) {
  const Icon = hasSearch ? SearchIcon : FolderIcon;
  const description = hint ?? (hasSearch ? "請調整搜尋條件後再試一次" : "資料建立後會顯示於此");

  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 sm:px-8">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-slate-800 bg-slate-950/70 text-slate-500">
            <Icon className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">{message}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
      </td>
    </tr>
  );
}
