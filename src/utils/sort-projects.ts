interface SortableProject {
  data: { isBoss: boolean; featured: boolean; order: number; title: string };
}

/** Boss first, then featured, then ascending `order`, then title. Returns a new array. */
export function sortProjects<T extends SortableProject>(projects: readonly T[]): T[] {
  return [...projects].sort(
    (a, b) =>
      Number(b.data.isBoss) - Number(a.data.isBoss) ||
      Number(b.data.featured) - Number(a.data.featured) ||
      a.data.order - b.data.order ||
      a.data.title.localeCompare(b.data.title),
  );
}
