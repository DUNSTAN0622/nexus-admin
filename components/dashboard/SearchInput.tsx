"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/dashboard/icons";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

type SearchInputProps = {
  ariaLabel: string;
  placeholder: string;
};

export default function SearchInput({
  ariaLabel,
  placeholder,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentKeyword = searchParams.get("search") ?? "";

  const updateSearchQuery = useDebouncedCallback((nextKeyword: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalizedKeyword = nextKeyword.trim();

    if (normalizedKeyword) {
      params.set("search", normalizedKeyword);
    } else {
      params.delete("search");
    }

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
  }, 300);

  return (
    <label className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 transition focus-within:border-cyan-300/40 focus-within:bg-slate-950">
      <SearchIcon className="size-4 text-slate-500 transition group-focus-within:text-cyan-300" />
      <input
        key={`${pathname}-${currentKeyword}`}
        aria-label={ariaLabel}
        type="search"
        defaultValue={currentKeyword}
        placeholder={placeholder}
        onChange={(event) => updateSearchQuery(event.target.value)}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
