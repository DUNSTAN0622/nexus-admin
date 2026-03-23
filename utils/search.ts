export type PageSearchParams = Promise<{
  search?: string | string[] | undefined;
}>;

export function normalizeSearchKeyword(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    const firstKeyword =
      value.find((searchEntry) => searchEntry.trim().length > 0) ?? "";
    return firstKeyword.trim();
  }

  return value?.trim() ?? "";
}

export async function getSearchKeyword(
  searchParams: PageSearchParams,
): Promise<string> {
  const { search } = await searchParams;
  return normalizeSearchKeyword(search);
}

export function buildSearchPattern(keyword: string) {
  return `%${keyword}%`;
}
