interface SortableProject {
  data: { featured: boolean; order: number; title: string };
}

/** Featured first, then ascending `order`, then title. Returns a new array. */
export function sortProjects<T extends SortableProject>(projects: readonly T[]): T[] {
  return [...projects].sort(
    (a, b) =>
      Number(b.data.featured) - Number(a.data.featured) ||
      a.data.order - b.data.order ||
      a.data.title.localeCompare(b.data.title),
  );
}
