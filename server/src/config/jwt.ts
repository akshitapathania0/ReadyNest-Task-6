export const jwtConfig = {
  accessSecret: process.env.JWT_SECRET || 'access-secret-fallback',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-fallback',
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
};
