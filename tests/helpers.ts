export const authHeader = (claims: { sub: string | number; email?: string; role?: string }) => ({
  'x-test-user': JSON.stringify({
    sub: String(claims.sub),
    email: claims.email ?? `user${claims.sub}@dev.local`,
    role: claims.role ?? 'User',
  }),
});