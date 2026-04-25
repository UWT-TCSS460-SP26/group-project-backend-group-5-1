import jwt from 'jsonwebtoken';

export const mintToken = (claims: { sub: number; email?: string; role?: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be set before minting test tokens');
  return jwt.sign(
    {
      sub: claims.sub,
      email: claims.email ?? `user${claims.sub}@dev.local`,
      role: claims.role ?? 'user',
    },
    secret,
    { expiresIn: '1h' },
  );
};

export const authHeader = (claims: { sub: number; email?: string; role?: string }) => ({
  Authorization: `Bearer ${mintToken(claims)}`,
});