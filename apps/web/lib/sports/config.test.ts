import { describe, it, expect } from 'vitest';
import { Footprints, Bike, Waves } from 'lucide-react';
import { SportType } from '@/gql/graphql';
import { SPORT_CONFIGS, ALL_SPORT_TYPES, getSportConfig, getFilteredSportConfigs } from './config';

describe('sports/config', () => {
  describe('SPORT_CONFIGS', () => {
    it('should have config for all SportType values', () => {
      const sportTypes = Object.values(SportType);
      sportTypes.forEach(sportType => {
        expect(SPORT_CONFIGS).toHaveProperty(sportType);
      });
    });

    it('should have correct structure for each config', () => {
      Object.entries(SPORT_CONFIGS).forEach(([key, config]) => {
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('href');
        expect(config).toHaveProperty('labelKey');
        expect(config).toHaveProperty('goalLabelKey');
        expect(config.type).toBe(key);
      });
    });

    it('should have correct RUN config', () => {
      const runConfig = SPORT_CONFIGS[SportType.Run];
      expect(runConfig.type).toBe(SportType.Run);
      expect(runConfig.icon).toBe(Footprints);
      expect(runConfig.href).toBe('/sports/running');
      expect(runConfig.labelKey).toBe('navigation.sports.running');
      expect(runConfig.goalLabelKey).toBe('sportTypes.run');
    });

    it('should have correct RIDE config', () => {
      const rideConfig = SPORT_CONFIGS[SportType.Ride];
      expect(rideConfig.type).toBe(SportType.Ride);
      expect(rideConfig.icon).toBe(Bike);
      expect(rideConfig.href).toBe('/sports/cycling');
      expect(rideConfig.labelKey).toBe('navigation.sports.cycling');
      expect(rideConfig.goalLabelKey).toBe('sportTypes.ride');
    });

    it('should have correct SWIM config', () => {
      const swimConfig = SPORT_CONFIGS[SportType.Swim];
      expect(swimConfig.type).toBe(SportType.Swim);
      expect(swimConfig.icon).toBe(Waves);
      expect(swimConfig.href).toBe('/sports/swimming');
      expect(swimConfig.labelKey).toBe('navigation.sports.swimming');
      expect(swimConfig.goalLabelKey).toBe('sportTypes.swim');
    });
  });

  describe('ALL_SPORT_TYPES', () => {
    it('should contain all sport types', () => {
      expect(ALL_SPORT_TYPES).toContain(SportType.Run);
      expect(ALL_SPORT_TYPES).toContain(SportType.Ride);
      expect(ALL_SPORT_TYPES).toContain(SportType.Swim);
    });

    it('should have correct length', () => {
      expect(ALL_SPORT_TYPES).toHaveLength(Object.values(SportType).length);
    });
  });

  describe('getSportConfig', () => {
    it('should return config for RUN', () => {
      const config = getSportConfig(SportType.Run);
      expect(config).toBeDefined();
      expect(config?.type).toBe(SportType.Run);
    });

    it('should return config for RIDE', () => {
      const config = getSportConfig(SportType.Ride);
      expect(config).toBeDefined();
      expect(config?.type).toBe(SportType.Ride);
    });

    it('should return config for SWIM', () => {
      const config = getSportConfig(SportType.Swim);
      expect(config).toBeDefined();
      expect(config?.type).toBe(SportType.Swim);
    });

    it('should return undefined for invalid type', () => {
      const config = getSportConfig('INVALID' as SportType);
      expect(config).toBeUndefined();
    });
  });

  describe('getFilteredSportConfigs', () => {
    it('should return configs for selected sports only', () => {
      const selectedSports = [SportType.Run, SportType.Ride];
      const configs = getFilteredSportConfigs(selectedSports);

      expect(configs).toHaveLength(2);
      expect(configs[0].type).toBe(SportType.Run);
      expect(configs[1].type).toBe(SportType.Ride);
    });

    it('should maintain order of input array', () => {
      const selectedSports = [SportType.Swim, SportType.Run, SportType.Ride];
      const configs = getFilteredSportConfigs(selectedSports);

      expect(configs).toHaveLength(3);
      expect(configs[0].type).toBe(SportType.Swim);
      expect(configs[1].type).toBe(SportType.Run);
      expect(configs[2].type).toBe(SportType.Ride);
    });

    it('should return empty array for empty input', () => {
      const configs = getFilteredSportConfigs([]);
      expect(configs).toEqual([]);
    });

    it('should filter out invalid sport types', () => {
      const selectedSports = [SportType.Run, 'INVALID' as SportType, SportType.Ride];
      const configs = getFilteredSportConfigs(selectedSports);

      expect(configs).toHaveLength(2);
      expect(configs.map(c => c.type)).toEqual([SportType.Run, SportType.Ride]);
    });

    it('should handle single sport selection', () => {
      const configs = getFilteredSportConfigs([SportType.Swim]);
      expect(configs).toHaveLength(1);
      expect(configs[0].type).toBe(SportType.Swim);
    });

    it('should handle all sports selected', () => {
      const allSports = [SportType.Run, SportType.Ride, SportType.Swim];
      const configs = getFilteredSportConfigs(allSports);

      expect(configs).toHaveLength(3);
      configs.forEach(config => {
        expect(allSports).toContain(config.type);
      });
    });

    it('should return correct SportConfig structure', () => {
      const configs = getFilteredSportConfigs([SportType.Run]);
      const config = configs[0];

      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('href');
      expect(config).toHaveProperty('labelKey');
      expect(config).toHaveProperty('goalLabelKey');
    });
  });
});
