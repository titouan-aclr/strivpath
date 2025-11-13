export function parseJwtExpirationToMs(expiration: string): number {
  const match = expiration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(
      `Invalid JWT expiration format: "${expiration}". ` +
        `Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const unitToMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitToMs[unit];
}
