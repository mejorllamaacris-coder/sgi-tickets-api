import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Ver qué tableros existen
  const tableros = await prisma.pd_tableros.findMany();
  console.log('📋 Tableros existentes:', tableros);
  
  // 2. Si no hay ninguno, creamos uno por defecto
  if (tableros.length === 0) {
    const areas = await prisma.areas.findMany();
    const areaId = areas.length > 0 ? areas[0].id : 1;
    
    const nuevoTablero = await prisma.pd_tableros.create({
      data: {
        nombre: 'Tablero Principal',
        id_area: areaId,
        activo: true,
      },
    });
    console.log('✅ Tablero creado con ID:', nuevoTablero.id);

    // Crear las 3 columnas básicas (Listas)
    await prisma.pd_listas.createMany({
      data: [
        { id_tablero: nuevoTablero.id, nombre: 'Por hacer', orden: 1 },
        { id_tablero: nuevoTablero.id, nombre: 'En progreso', orden: 2 },
        { id_tablero: nuevoTablero.id, nombre: 'Hecho', orden: 3 },
      ],
    });
    console.log('✅ Listas (columnas) creadas para el tablero');
  }
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
