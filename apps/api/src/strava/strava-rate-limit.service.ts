import { Injectable } from '@nestjs/common';

interface RateLimitWindow {
  used: number;
  limit: number;
}

interface RateLimitState {
  overall15min: RateLimitWindow;
  overallDaily: RateLimitWindow;
  read15min: RateLimitWindow;
  readDaily: RateLimitWindow;
  lastUpdatedAt: Date | null;
  nextWindowResetAt: Date | null;
  nextDailyResetAt: Date | null;
}

const BACKOFF_THRESHOLD = 0.8;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

@Injectable()
export class StravaRateLimitService {
  private state: RateLimitState = {
    overall15min: { used: 0, limit: 200 },
    overallDaily: { used: 0, limit: 2000 },
    read15min: { used: 0, limit: 100 },
    readDaily: { used: 0, limit: 1000 },
    lastUpdatedAt: null,
    nextWindowResetAt: null,
    nextDailyResetAt: null,
  };

  updateFromHeaders(headers: Record<string, string | string[] | undefined>): void {
    const normalizedHeaders: Record<string, string | undefined> = {};
    for (const key of Object.keys(headers)) {
      const value = headers[key];
      normalizedHeaders[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
    }

    const overallLimit = this.parseRateLimitHeader(normalizedHeaders['x-ratelimit-limit']);
    const overallUsage = this.parseRateLimitHeader(normalizedHeaders['x-ratelimit-usage']);
    const readLimit = this.parseRateLimitHeader(normalizedHeaders['x-readratelimit-limit']);
    const readUsage = this.parseRateLimitHeader(normalizedHeaders['x-readratelimit-usage']);

    const updated = overallLimit || overallUsage || readLimit || readUsage;

    if (overallLimit) {
      this.state.overall15min.limit = overallLimit[0];
      this.state.overallDaily.limit = overallLimit[1];
    }
    if (overallUsage) {
      this.state.overall15min.used = overallUsage[0];
      this.state.overallDaily.used = overallUsage[1];
    }
    if (readLimit) {
      this.state.read15min.limit = readLimit[0];
      this.state.readDaily.limit = readLimit[1];
    }
    if (readUsage) {
      this.state.read15min.used = readUsage[0];
      this.state.readDaily.used = readUsage[1];
    }

    if (updated) {
      const now = new Date();
      this.state.lastUpdatedAt = now;
      this.state.nextWindowResetAt = this.computeNextQuarterHour(now);
      this.state.nextDailyResetAt = this.computeNextMidnightUTC(now);
    }
  }

  isApproachingLimit(): boolean {
    const now = new Date();

    if (this.isFifteenMinStateFresh(now)) {
      if (
        this.isWindowApproachingLimit(this.state.overall15min) ||
        this.isWindowApproachingLimit(this.state.read15min)
      ) {
        return true;
      }
    }

    if (this.isDailyStateFresh(now)) {
      if (
        this.isWindowApproachingLimit(this.state.overallDaily) ||
        this.isWindowApproachingLimit(this.state.readDaily)
      ) {
        return true;
      }
    }

    return false;
  }

  isApproachingDailyLimit(): boolean {
    const now = new Date();
    if (!this.isDailyStateFresh(now)) return false;
    return (
      this.isWindowApproachingLimit(this.state.overallDaily) || this.isWindowApproachingLimit(this.state.readDaily)
    );
  }

  getCurrentState(): Readonly<RateLimitState> {
    return this.state;
  }

  private isFifteenMinStateFresh(now: Date): boolean {
    if (this.state.nextWindowResetAt === null) return true;
    return now < this.state.nextWindowResetAt;
  }

  private isDailyStateFresh(now: Date): boolean {
    if (this.state.nextDailyResetAt === null) return true;
    return now < this.state.nextDailyResetAt;
  }

  private computeNextQuarterHour(now: Date): Date {
    return new Date(Math.floor(now.getTime() / FIFTEEN_MIN_MS) * FIFTEEN_MIN_MS + FIFTEEN_MIN_MS);
  }

  private computeNextMidnightUTC(now: Date): Date {
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    return midnight;
  }

  private isWindowApproachingLimit(window: RateLimitWindow): boolean {
    if (window.limit === 0) return false;
    return window.used / window.limit >= BACKOFF_THRESHOLD;
  }

  private parseRateLimitHeader(value: string | undefined): [number, number] | null {
    if (!value) return null;
    const parts = value.split(',');
    if (parts.length !== 2) return null;
    const first = parseInt(parts[0].trim(), 10);
    const second = parseInt(parts[1].trim(), 10);
    if (isNaN(first) || isNaN(second)) return null;
    return [first, second];
  }
}
