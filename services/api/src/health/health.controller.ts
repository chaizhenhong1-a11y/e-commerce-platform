import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      service: 'Elvane API',
      status: 'ok',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
    };
  }
}
