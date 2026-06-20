/**
 * One shared id generator. Returns a string UUID via crypto.randomUUID() when
 * available, with a timestamp + random fallback for environments that lack it.
 * Used by InMemoryGateway and DbGateway create() when body[idKey] is unset; a
 * developer-supplied id is always honored upstream.
 */
export function genId(): string {
  const c: { randomUUID?: () => string } | undefined =
    typeof crypto !== 'undefined' ? (crypto as { randomUUID?: () => string }) : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
