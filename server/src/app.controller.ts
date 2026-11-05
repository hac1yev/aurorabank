import { Controller, Get } from '@nestjs/common';

@Controller('app')
export class AppController {
  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      message: 'Auroraa API is running',
    };
  }
}
