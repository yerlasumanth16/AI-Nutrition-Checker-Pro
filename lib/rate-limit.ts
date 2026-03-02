const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const found = requests.get(key);

  if (!found || found.resetAt < now) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (found.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  found.count += 1;
  requests.set(key, found);
  return { allowed: true, remaining: limit - found.count };
}
