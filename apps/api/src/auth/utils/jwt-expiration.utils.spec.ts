import { parseJwtExpirationToMs } from './jwt-expiration.utils';

describe('parseJwtExpirationToMs', () => {
  describe('valid expiration strings', () => {
    it('should parse seconds correctly', () => {
      expect(parseJwtExpirationToMs('30s')).toBe(30 * 1000);
      expect(parseJwtExpirationToMs('1s')).toBe(1000);
      expect(parseJwtExpirationToMs('90s')).toBe(90 * 1000);
    });

    it('should parse minutes correctly', () => {
      expect(parseJwtExpirationToMs('15m')).toBe(15 * 60 * 1000);
      expect(parseJwtExpirationToMs('1m')).toBe(60 * 1000);
      expect(parseJwtExpirationToMs('30m')).toBe(30 * 60 * 1000);
    });

    it('should parse hours correctly', () => {
      expect(parseJwtExpirationToMs('2h')).toBe(2 * 60 * 60 * 1000);
      expect(parseJwtExpirationToMs('1h')).toBe(60 * 60 * 1000);
      expect(parseJwtExpirationToMs('24h')).toBe(24 * 60 * 60 * 1000);
    });

    it('should parse days correctly', () => {
      expect(parseJwtExpirationToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
      expect(parseJwtExpirationToMs('1d')).toBe(24 * 60 * 60 * 1000);
      expect(parseJwtExpirationToMs('30d')).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('should handle large numbers', () => {
      expect(parseJwtExpirationToMs('365d')).toBe(365 * 24 * 60 * 60 * 1000);
      expect(parseJwtExpirationToMs('1440m')).toBe(1440 * 60 * 1000);
    });
  });

  describe('invalid expiration strings', () => {
    it('should throw error for invalid format without unit', () => {
      expect(() => parseJwtExpirationToMs('15')).toThrow(
        'Invalid JWT expiration format: "15". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });

    it('should throw error for invalid format without number', () => {
      expect(() => parseJwtExpirationToMs('m')).toThrow(
        'Invalid JWT expiration format: "m". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });

    it('should throw error for invalid unit', () => {
      expect(() => parseJwtExpirationToMs('15x')).toThrow(
        'Invalid JWT expiration format: "15x". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });

    it('should throw error for completely invalid string', () => {
      expect(() => parseJwtExpirationToMs('invalid')).toThrow(
        'Invalid JWT expiration format: "invalid". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => parseJwtExpirationToMs('')).toThrow(
        'Invalid JWT expiration format: "". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });

    it('should throw error for string with spaces', () => {
      expect(() => parseJwtExpirationToMs('15 m')).toThrow(
        'Invalid JWT expiration format: "15 m". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });

    it('should throw error for negative numbers', () => {
      expect(() => parseJwtExpirationToMs('-15m')).toThrow(
        'Invalid JWT expiration format: "-15m". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });

    it('should throw error for decimal numbers', () => {
      expect(() => parseJwtExpirationToMs('15.5m')).toThrow(
        'Invalid JWT expiration format: "15.5m". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
      expect(parseJwtExpirationToMs('0s')).toBe(0);
      expect(parseJwtExpirationToMs('0m')).toBe(0);
    });

    it('should be case-sensitive for units', () => {
      expect(() => parseJwtExpirationToMs('15M')).toThrow(
        'Invalid JWT expiration format: "15M". Expected format: number + unit (s/m/h/d), e.g., "15m", "7d"',
      );
    });
  });

  describe('real-world scenarios', () => {
    it('should correctly parse default access token expiration', () => {
      const result = parseJwtExpirationToMs('15m');
      expect(result).toBe(900000);
    });

    it('should correctly parse default refresh token expiration', () => {
      const result = parseJwtExpirationToMs('7d');
      expect(result).toBe(604800000);
    });

    it('should match manual calculation for 30 minutes', () => {
      const result = parseJwtExpirationToMs('30m');
      const manualCalculation = 30 * 60 * 1000;
      expect(result).toBe(manualCalculation);
    });
  });
});
