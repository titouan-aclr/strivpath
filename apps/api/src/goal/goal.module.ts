import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { GoalTemplateService } from './goal-template.service';
import { GoalResolver } from './goal.resolver';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';

@Module({
  imports: [UserPreferencesModule],
  providers: [GoalService, GoalTemplateService, GoalResolver],
  exports: [GoalService, GoalTemplateService],
})
export class GoalModule {}
