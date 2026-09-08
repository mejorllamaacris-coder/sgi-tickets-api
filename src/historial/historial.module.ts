import { Module, Global } from '@nestjs/common';
import { HistorialService } from './historial.service.js';

@Global() // Lo hacemos global para que cualquier módulo lo pueda inyectar sin importar el módulo
@Module({
  providers: [HistorialService],
  exports: [HistorialService],
})
export class HistorialModule {}
