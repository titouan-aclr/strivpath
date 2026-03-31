import { SportType } from '../../user-preferences/enums/sport-type.enum';
import { getStravaTypesForSport, getSportTypeFromStravaType, STRAVA_SPORT_TYPE_MAPPING } from './sport-type.utils';

describe('sport-type.utils', () => {
  describe('STRAVA_SPORT_TYPE_MAPPING', () => {
    it('should have mappings for all sport types', () => {
      expect(STRAVA_SPORT_TYPE_MAPPING).toHaveProperty(SportType.RUN);
      expect(STRAVA_SPORT_TYPE_MAPPING).toHaveProperty(SportType.RIDE);
      expect(STRAVA_SPORT_TYPE_MAPPING).toHaveProperty(SportType.SWIM);
    });

    it('should have correct Strava types for RUN', () => {
      expect(STRAVA_SPORT_TYPE_MAPPING[SportType.RUN]).toEqual(['Run', 'TrailRun', 'VirtualRun']);
    });

    it('should have correct Strava types for RIDE', () => {
      expect(STRAVA_SPORT_TYPE_MAPPING[SportType.RIDE]).toEqual([
        'Ride',
        'MountainBikeRide',
        'VirtualRide',
        'EBikeRide',
        'EMountainBikeRide',
        'Velomobile',
      ]);
    });

    it('should have correct Strava types for SWIM', () => {
      expect(STRAVA_SPORT_TYPE_MAPPING[SportType.SWIM]).toEqual(['Swim']);
    });
  });

  describe('getStravaTypesForSport', () => {
    it('should return all Strava types for RUN', () => {
      const result = getStravaTypesForSport(SportType.RUN);
      expect(result).toEqual(['Run', 'TrailRun', 'VirtualRun']);
    });

    it('should return all Strava types for RIDE', () => {
      const result = getStravaTypesForSport(SportType.RIDE);
      expect(result).toEqual([
        'Ride',
        'MountainBikeRide',
        'VirtualRide',
        'EBikeRide',
        'EMountainBikeRide',
        'Velomobile',
      ]);
    });

    it('should return all Strava types for SWIM', () => {
      const result = getStravaTypesForSport(SportType.SWIM);
      expect(result).toEqual(['Swim']);
    });

    it('should return empty array for unknown sport', () => {
      const result = getStravaTypesForSport('UNKNOWN' as SportType);
      expect(result).toEqual([]);
    });

    it('should return a new array (not reference)', () => {
      const result1 = getStravaTypesForSport(SportType.RUN);
      const result2 = getStravaTypesForSport(SportType.RUN);
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });

    it('should not mutate the original mapping when result is modified', () => {
      const result = getStravaTypesForSport(SportType.RUN);
      result.push('ModifiedValue');
      expect(STRAVA_SPORT_TYPE_MAPPING[SportType.RUN]).toEqual(['Run', 'TrailRun', 'VirtualRun']);
    });
  });

  describe('getSportTypeFromStravaType', () => {
    describe('RUN types', () => {
      it('should return RUN for Run', () => {
        expect(getSportTypeFromStravaType('Run')).toBe(SportType.RUN);
      });

      it('should return RUN for TrailRun', () => {
        expect(getSportTypeFromStravaType('TrailRun')).toBe(SportType.RUN);
      });

      it('should return RUN for VirtualRun', () => {
        expect(getSportTypeFromStravaType('VirtualRun')).toBe(SportType.RUN);
      });
    });

    describe('RIDE types', () => {
      it('should return RIDE for Ride', () => {
        expect(getSportTypeFromStravaType('Ride')).toBe(SportType.RIDE);
      });

      it('should return RIDE for MountainBikeRide', () => {
        expect(getSportTypeFromStravaType('MountainBikeRide')).toBe(SportType.RIDE);
      });

      it('should return RIDE for VirtualRide', () => {
        expect(getSportTypeFromStravaType('VirtualRide')).toBe(SportType.RIDE);
      });

      it('should return RIDE for EBikeRide', () => {
        expect(getSportTypeFromStravaType('EBikeRide')).toBe(SportType.RIDE);
      });

      it('should return RIDE for EMountainBikeRide', () => {
        expect(getSportTypeFromStravaType('EMountainBikeRide')).toBe(SportType.RIDE);
      });

      it('should return RIDE for Velomobile', () => {
        expect(getSportTypeFromStravaType('Velomobile')).toBe(SportType.RIDE);
      });
    });

    describe('SWIM types', () => {
      it('should return SWIM for Swim', () => {
        expect(getSportTypeFromStravaType('Swim')).toBe(SportType.SWIM);
      });
    });

    describe('Unknown types', () => {
      it('should return null for unknown Strava type', () => {
        expect(getSportTypeFromStravaType('Unknown')).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(getSportTypeFromStravaType('')).toBeNull();
      });

      it('should return null for case-sensitive mismatch', () => {
        expect(getSportTypeFromStravaType('run')).toBeNull();
        expect(getSportTypeFromStravaType('RUN')).toBeNull();
        expect(getSportTypeFromStravaType('RIDE')).toBeNull();
      });

      it('should return null for partial matches', () => {
        expect(getSportTypeFromStravaType('Ru')).toBeNull();
        expect(getSportTypeFromStravaType('Running')).toBeNull();
      });

      it('should return null for other Strava activity types', () => {
        expect(getSportTypeFromStravaType('Hike')).toBeNull();
        expect(getSportTypeFromStravaType('Walk')).toBeNull();
        expect(getSportTypeFromStravaType('Yoga')).toBeNull();
        expect(getSportTypeFromStravaType('Rowing')).toBeNull();
      });
    });
  });
});
