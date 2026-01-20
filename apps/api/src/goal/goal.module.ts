import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { GoalTemplateService } from './goal-template.service';
import { GoalProgressUpdateService } from './goal-progress-update.service';
import { GoalResolver } from './goal.resolver';

@Module({
  providers: [GoalService, GoalTemplateService, GoalProgressUpdateService, GoalResolver],
  exports: [GoalService, GoalTemplateService, GoalProgressUpdateService],
})
export class GoalModule {}
