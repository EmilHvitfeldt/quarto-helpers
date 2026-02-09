/**
 * Generic cache manager with TTL support.
 */
export class CacheManager<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  /**
   * Create a cache manager.
   * @param ttlMs Time-to-live in milliseconds (default: 5000ms)
   */
  constructor(ttlMs: number = 5000) {
    this.ttl = ttlMs;
  }

  /**
   * Get cached data or compute and cache it.
   * @param key Cache key
   * @param compute Function to compute data if not cached or expired
   */
  getOrCompute(key: string, compute: () => T): T {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && (now - cached.timestamp) < this.ttl) {
      return cached.data;
    }

    const data = compute();

    this.cache.set(key, {
      data,
      timestamp: now,
    });

    return data;
  }

  /**
   * Clear all cached data.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear a specific cache entry.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
}
