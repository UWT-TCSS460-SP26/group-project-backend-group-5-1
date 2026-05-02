export type TestRole = 'User' | 'Moderator' | 'Admin' | 'SuperAdmin' | 'Owner';
export interface TestUserClaims {
  sub: string;
  email?: string;
  role?: TestRole;
}
export const authHeader = (claims: TestUserClaims): Record<string, string> => ({
  'x-test-user': JSON.stringify({
    sub: claims.sub,
    email: claims.email ?? `${claims.sub}@test.local`,
    role: claims.role ?? 'User',
  }),
});