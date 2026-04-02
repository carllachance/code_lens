export function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number): T {
  let handle: NodeJS.Timeout | undefined;
  return ((...args: Parameters<T>) => {
    if (handle) {
      clearTimeout(handle);
    }
    handle = setTimeout(() => fn(...args), waitMs);
  }) as T;
}
