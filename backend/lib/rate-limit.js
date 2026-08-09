const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 12;
const CLEANUP_INTERVAL = 10 * 60 * 1000;
const buckets = new Map();

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return 'ip:' + first;
  }
  return 'ip:' + (req.socket.remoteAddress || 'unknown');
}

function prune() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.reset > WINDOW_MS) buckets.delete(key);
  }
}

setInterval(prune, CLEANUP_INTERVAL).unref();

export function limit(req) {
  const now = Date.now();
  const key = clientKey(req);
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.reset > WINDOW_MS) {
    bucket = { count: 0, reset: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const remaining = Math.max(0, MAX_ATTEMPTS - bucket.count);
  const retryAfter = Math.max(1, Math.ceil((bucket.reset - now) / 1000));
  return { allowed: bucket.count <= MAX_ATTEMPTS, remaining, retryAfter };
}
