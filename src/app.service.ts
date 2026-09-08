import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SGI Tickets API Standalone corriendo 🚀';
  }
}
