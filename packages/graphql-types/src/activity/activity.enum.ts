import { registerEnumType } from '@nestjs/graphql';

/* eslint-disable no-unused-vars */
export enum ActivityType {
  RUN = 'Run',
  RIDE = 'Ride',
  SWIM = 'Swim',
  WALK = 'Walk',
  HIKE = 'Hike',
  ALPINE_SKI = 'AlpineSki',
  BACKCOUNTRY_SKI = 'BackcountrySki',
  CANOE = 'Canoe',
  CROSSFIT = 'Crossfit',
  ELLIPTICAL = 'Elliptical',
  GOLF = 'Golf',
  HANDCYCLE = 'Handcycle',
  INLINE_SKATE = 'InlineSkate',
  KAYAK = 'Kayaking',
  KITESURF = 'Kitesurf',
  NORDIC_SKI = 'NordicSki',
  ROCK_CLIMB = 'RockClimbing',
  ROLLER_SKI = 'RollerSki',
  ROWING = 'Rowing',
  SNOWBOARD = 'Snowboard',
  SNOWSHOE = 'Snowshoe',
  SOCCER = 'Soccer',
  STAIR_STEPPER = 'StairStepper',
  STAND_UP_PADDLING = 'StandUpPaddling',
  SURFING = 'Surfing',
  VELOMOBILE = 'Velomobile',
  VIRTUAL_RIDE = 'VirtualRide',
  VIRTUAL_RUN = 'VirtualRun',
  WEIGHT_TRAINING = 'WeightTraining',
  WHEELCHAIR = 'Wheelchair',
  WINDSURF = 'Windsurf',
  WORKOUT = 'Workout',
  YOGA = 'Yoga',
}
/* eslint-enable no-unused-vars */

registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'Types of activities supported by Strava',
});
