import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BotService } from './bot/bot.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BotService],
})
export class AppModule {}
