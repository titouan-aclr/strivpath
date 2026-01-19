import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('Health API Route', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = GET();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'healthy');
    });

    it('should return a timestamp', async () => {
      const response = GET();
      const data = await response.json();

      expect(data).toHaveProperty('timestamp');
      expect(typeof data.timestamp).toBe('string');
    });

    it('should return a valid ISO timestamp', async () => {
      const mockDate = new Date('2025-01-15T12:00:00.000Z');
      vi.setSystemTime(mockDate);

      const response = GET();
      const data = await response.json();

      expect(data.timestamp).toBe('2025-01-15T12:00:00.000Z');
    });

    it('should return a Response object', () => {
      const response = GET();

      expect(response).toBeInstanceOf(Response);
    });

    it('should return JSON content type', () => {
      const response = GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return 200 status code', () => {
      const response = GET();

      expect(response.status).toBe(200);
    });
  });
});
