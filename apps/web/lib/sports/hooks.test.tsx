import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SportType } from '@/gql/graphql';
import { useAvailableSports } from './hooks';
import { SPORT_CONFIGS } from './config';
import { MOCK_USER_PREFERENCES } from '@/mocks/fixtures/settings.fixture';

vi.mock('@/lib/settings/use-user-preferences', () => ({
  useUserPreferences: vi.fn(),
}));

import { useUserPreferences } from '@/lib/settings/use-user-preferences';

const mockUseUserPreferences = useUserPreferences as ReturnType<typeof vi.fn>;

describe('useAvailableSports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty arrays when no user preferences', () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: null,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAvailableSports());

    expect(result.current.availableSports).toEqual([]);
    expect(result.current.sportConfigs).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should return sport configs for user selected sports', () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: MOCK_USER_PREFERENCES.default,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAvailableSports());

    expect(result.current.availableSports).toEqual([SportType.Run, SportType.Ride]);
    expect(result.current.sportConfigs).toHaveLength(2);
    expect(result.current.sportConfigs[0]).toBe(SPORT_CONFIGS[SportType.Run]);
    expect(result.current.sportConfigs[1]).toBe(SPORT_CONFIGS[SportType.Ride]);
    expect(result.current.loading).toBe(false);
  });

  it('should return loading state when preferences loading', () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: null,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAvailableSports());

    expect(result.current.loading).toBe(true);
    expect(result.current.availableSports).toEqual([]);
    expect(result.current.sportConfigs).toEqual([]);
  });

  it('should handle single sport selection', () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: MOCK_USER_PREFERENCES.singleSport,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAvailableSports());

    expect(result.current.availableSports).toEqual([SportType.Run]);
    expect(result.current.sportConfigs).toHaveLength(1);
    expect(result.current.sportConfigs[0]).toBe(SPORT_CONFIGS[SportType.Run]);
  });

  it('should handle all sports selected', () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: MOCK_USER_PREFERENCES.allSports,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAvailableSports());

    expect(result.current.availableSports).toEqual([SportType.Run, SportType.Ride, SportType.Swim]);
    expect(result.current.sportConfigs).toHaveLength(3);
    expect(result.current.sportConfigs[0]).toBe(SPORT_CONFIGS[SportType.Run]);
    expect(result.current.sportConfigs[1]).toBe(SPORT_CONFIGS[SportType.Ride]);
    expect(result.current.sportConfigs[2]).toBe(SPORT_CONFIGS[SportType.Swim]);
  });

  it('should return empty availableSports when preferences has empty selectedSports', () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: {
        ...MOCK_USER_PREFERENCES.default,
        selectedSports: [],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAvailableSports());

    expect(result.current.availableSports).toEqual([]);
    expect(result.current.sportConfigs).toEqual([]);
  });

  it('should memoize sportConfigs based on availableSports', () => {
    const preferences = MOCK_USER_PREFERENCES.default;
    mockUseUserPreferences.mockReturnValue({
      preferences,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result, rerender } = renderHook(() => useAvailableSports());

    const firstConfigs = result.current.sportConfigs;

    rerender();

    expect(result.current.sportConfigs).toBe(firstConfigs);
  });

  it('should update sportConfigs when availableSports changes', () => {
    mockUseUserPreferences.mockReturnValue({
      preferences: MOCK_USER_PREFERENCES.singleSport,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result, rerender } = renderHook(() => useAvailableSports());

    expect(result.current.sportConfigs).toHaveLength(1);

    mockUseUserPreferences.mockReturnValue({
      preferences: MOCK_USER_PREFERENCES.allSports,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    rerender();

    expect(result.current.sportConfigs).toHaveLength(3);
  });
});
