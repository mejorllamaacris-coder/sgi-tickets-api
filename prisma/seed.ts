import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de Demo...');

  // 1. Limpiar datos dependientes (en orden inverso de creación)
  await prisma.pd_historial.deleteMany();
  await prisma.pd_comentarios.deleteMany();
  await prisma.pd_tickets.deleteMany();
  await prisma.pd_listas.deleteMany();
  await prisma.pd_tableros.deleteMany();
  await prisma.pd_categorias.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.areas.deleteMany();

  // 2. Crear Áreas
  const areaSistemas = await prisma.areas.create({ data: { nombre: 'Sistemas y Desarrollo' } });
  const areaSoporte = await prisma.areas.create({ data: { nombre: 'Soporte Técnico' } });

  // 3. Crear Usuarios
  const u1 = await prisma.usuarios.create({ data: { nombre: 'Cristian Demo', email: 'cristian@sgi.com', password_hash: 'hash123', id_area: areaSistemas.id } });
  const u2 = await prisma.usuarios.create({ data: { nombre: 'Cristian Carabalí', email: 'dev@sgi.com', password_hash: 'hash123', id_area: areaSistemas.id } });
  const u3 = await prisma.usuarios.create({ data: { nombre: 'Ana Soporte', email: 'ana@sgi.com', password_hash: 'hash123', id_area: areaSoporte.id } });
  const u4 = await prisma.usuarios.create({ data: { nombre: 'Roberto Gerente', email: 'roberto@sgi.com', password_hash: 'hash123', id_area: areaSistemas.id } });

  // 4. Asegurar Catálogos (Estados y Complejidades) de forma idempotente (evita errores de secuencia)
  const getOrCreateEstado = async (nombre: string, color: string, es_final: boolean) => {
    let estado = await prisma.pd_estados.findFirst({ where: { nombre } });
    if (!estado) estado = await prisma.pd_estados.create({ data: { nombre, color, es_final } });
    return estado;
  };

  const getOrCreateComplejidad = async (nombre: string, color: string, horas: number) => {
    let comp = await prisma.pd_complejidades.findFirst({ where: { nombre } });
    if (!comp) comp = await prisma.pd_complejidades.create({ data: { nombre, color, horas_estimadas: horas } });
    return comp;
  };

  const estados = await Promise.all([
    getOrCreateEstado('Abierto', '#3b82f6', false),
    getOrCreateEstado('En progreso', '#f59e0b', false),
    getOrCreateEstado('En revisión', '#8b5cf6', false),
    getOrCreateEstado('Cerrado', '#10b981', true),
  ]);

  const complejidades = await Promise.all([
    getOrCreateComplejidad('Baja', '#10b981', 2),
    getOrCreateComplejidad('Media', '#f59e0b', 4),
    getOrCreateComplejidad('Alta', '#ef4444', 8),
  ]);

  let catSistemas = await prisma.pd_categorias.findFirst({ where: { nombre: 'Bug Crítico', id_area: areaSistemas.id } });
  if (!catSistemas) {
    catSistemas = await prisma.pd_categorias.create({ data: { nombre: 'Bug Crítico', id_area: areaSistemas.id } });
  }

  // 5. Crear Tablero y Listas (Kanban)
  let tablero = await prisma.pd_tableros.findFirst({ where: { id_area: areaSistemas.id } });
  if (!tablero) {
    tablero = await prisma.pd_tableros.create({ data: { nombre: 'Tablero de Sistemas', id_area: areaSistemas.id, activo: true } });
  }
  
  const getOrCreateLista = async (nombre: string, orden: number) => {
    let lista = await prisma.pd_listas.findFirst({ where: { nombre, id_tablero: tablero!.id } });
    if (!lista) lista = await prisma.pd_listas.create({ data: { id_tablero: tablero!.id, nombre, orden } });
    return lista;
  };

  const lBacklog = await getOrCreateLista('Backlog', 1);
  const lTodo = await getOrCreateLista('Por Hacer', 2);
  const lProgreso = await getOrCreateLista('En Desarrollo', 3);
  const lDone = await getOrCreateLista('Hecho', 4);

  // 6. Crear Tickets de Ejemplo
  const ticket1 = await prisma.pd_tickets.create({
    data: {
      codigo: 'TK-2026-0001',
      titulo: 'Falla en el módulo de facturación',
      descripcion: 'El sistema arroja error 500 al generar la factura mensual.',
      tipo: 'soporte',
      id_area: areaSistemas.id,
      id_estado: estados[1].id, // En progreso
      id_lista: lProgreso.id,
      id_complejidad: complejidades[2].id, // Alta
      id_categoria: catSistemas.id,
      id_creador: u4.id,
      id_asignado: u2.id,
      fecha_limite: new Date(Date.now() + 8 * 60 * 60 * 1000),
    }
  });

  const ticket2 = await prisma.pd_tickets.create({
    data: {
      codigo: 'TK-2026-0002',
      titulo: 'Actualizar dependencias de Node.js',
      descripcion: 'Migrar a la versión LTS más reciente para mejorar la seguridad.',
      tipo: 'soporte',
      id_area: areaSistemas.id,
      id_estado: estados[0].id, // Abierto
      id_lista: lTodo.id,
      id_complejidad: complejidades[1].id, // Media
      id_creador: u1.id,
      id_asignado: u1.id,
      fecha_limite: new Date(Date.now() + 4 * 60 * 60 * 1000),
    }
  });

  // 7. Generar Historial y Comentarios de Ejemplo
  await prisma.pd_historial.createMany({
    data: [
      { id_ticket: ticket1.id, id_usuario: u4.id, accion: 'creado', detalle: 'Ticket creado por Gerencia' },
      { id_ticket: ticket1.id, id_usuario: u2.id, accion: 'actualizado', detalle: 'Estado: "Abierto" → "En progreso"' },
      { id_ticket: ticket2.id, id_usuario: u1.id, accion: 'creado', detalle: 'Ticket creado' },
    ]
  });

  await prisma.pd_comentarios.create({
    data: {
      id_ticket: ticket1.id,
      id_usuario: u2.id,
      contenido: 'Ya estoy revisando los logs del servidor, parece ser un problema de timeout en la BD.',
      es_interno: true,
    }
  });

  console.log('✅ Seed completado exitosamente. ¡Base de datos lista para la demo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
