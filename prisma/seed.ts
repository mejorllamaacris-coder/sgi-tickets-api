import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  await prisma.pd_miembros_tablero.deleteMany();
  await prisma.pd_listas.deleteMany();
  await prisma.pd_tableros.deleteMany();
  await prisma.pd_checklists.deleteMany();
  await prisma.pd_historial.deleteMany();
  await prisma.pd_comentarios.deleteMany();
  await prisma.pd_tickets.deleteMany();
  await prisma.pd_categorias.deleteMany();
  await prisma.pd_complejidades.deleteMany();
  await prisma.pd_estados.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.areas.deleteMany();
  await prisma.roles.deleteMany();

  const rolAdmin = await prisma.roles.create({ data: { nombre: 'admin', descripcion: 'Acceso total', permisos: ['admin', 'tickets.leer', 'tickets.crear', 'tickets.editar', 'tickets.eliminar', 'tableros.gestionar', 'reportes.ver'] } });
  const rolTecnico = await prisma.roles.create({ data: { nombre: 'tecnico', descripcion: 'Gestión de tickets', permisos: ['tickets.leer', 'tickets.crear', 'tickets.editar'] } });

  const areaSistemas = await prisma.areas.create({ data: { nombre: 'Sistemas', activo: true } });
  const areaRRHH = await prisma.areas.create({ data: { nombre: 'Recursos Humanos', activo: true } });

  const hash = await bcrypt.hash('123456', 10);
  const userAdmin = await prisma.usuarios.create({ data: { nombre: 'Cristian Demo', email: 'cristian@sgi.com', password_hash: hash, id_area: areaSistemas.id, id_rol: rolAdmin.id } });
  const userTecnico = await prisma.usuarios.create({ data: { nombre: 'Juan Técnico', email: 'juan@sgi.com', password_hash: hash, id_area: areaSistemas.id, id_rol: rolTecnico.id } });

  const estadoAbierto = await prisma.pd_estados.create({ data: { nombre: 'Abierto', color: '#3b82f6', es_final: false } });
  const estadoProgreso = await prisma.pd_estados.create({ data: { nombre: 'En progreso', color: '#f59e0b', es_final: false } });
  const estadoRevision = await prisma.pd_estados.create({ data: { nombre: 'En revisión', color: '#8b5cf6', es_final: false } });
  const estadoCerrado = await prisma.pd_estados.create({ data: { nombre: 'Cerrado', color: '#10b981', es_final: true } });

  const compBaja = await prisma.pd_complejidades.create({ data: { nombre: 'Baja', color: '#10b981', horas_estimadas: 2 } });
  const compMedia = await prisma.pd_complejidades.create({ data: { nombre: 'Media', color: '#f59e0b', horas_estimadas: 8 } });
  const compAlta = await prisma.pd_complejidades.create({ data: { nombre: 'Alta', color: '#ef4444', horas_estimadas: 24 } });

  // Categorías del SGE-NES real
  const catSoporteTI     = await prisma.pd_categorias.create({ data: { nombre: 'Soporte Técnico TI', tipo_ticket: 'soporte', id_area: areaSistemas.id } });
  const catFacturacion   = await prisma.pd_categorias.create({ data: { nombre: 'Facturación y Notas Crédito/Débito', tipo_ticket: 'soporte', id_area: areaSistemas.id } });
  const catPQRS          = await prisma.pd_categorias.create({ data: { nombre: 'Seguimiento de Casos PQRS', tipo_ticket: 'soporte', id_area: areaRRHH.id } });
  const catReclamos      = await prisma.pd_categorias.create({ data: { nombre: 'Reclamos por Calidad de Producto', tipo_ticket: 'soporte', id_area: areaRRHH.id } });
  const catPasarela      = await prisma.pd_categorias.create({ data: { nombre: 'Fallas en Pasarela de Pagos', tipo_ticket: 'soporte', id_area: areaSistemas.id } });
  const catDesarrollo    = await prisma.pd_categorias.create({ data: { nombre: 'Desarrollo de Software', tipo_ticket: 'proyecto', id_area: areaSistemas.id } });
  const catInfra         = await prisma.pd_categorias.create({ data: { nombre: 'Infraestructura', tipo_ticket: 'proyecto', id_area: areaSistemas.id } });
  const catDB            = await prisma.pd_categorias.create({ data: { nombre: 'Base de Datos', tipo_ticket: 'proyecto', id_area: areaSistemas.id } });
  const catIntegraciones = await prisma.pd_categorias.create({ data: { nombre: 'Integraciones con Marketplace', tipo_ticket: 'proyecto', id_area: areaSistemas.id } });
  const catEstrategia    = await prisma.pd_categorias.create({ data: { nombre: 'Estrategia y Planeación', tipo_ticket: 'proyecto', id_area: areaRRHH.id } });

  const tablero = await prisma.pd_tableros.create({
    data: {
      nombre: 'Tablero de Sistemas',
      descripcion: 'Gestión de tickets del área de sistemas',
      id_area: areaSistemas.id,
      listas: {
        create: [
          { nombre: 'Backlog', orden: 0, wip_limit: null },
          { nombre: 'Por Hacer', orden: 1, wip_limit: 5 },
          { nombre: 'En Desarrollo', orden: 2, wip_limit: 3 },
          { nombre: 'Hecho', orden: 3, wip_limit: null },
        ],
      },
    },
    include: { listas: true },
  });

  const listaBacklog       = tablero.listas.find(l => l.nombre === 'Backlog')!;
  const listaPorHacer      = tablero.listas.find(l => l.nombre === 'Por Hacer')!;
  const listaEnDesarrollo  = tablero.listas.find(l => l.nombre === 'En Desarrollo')!;

  // 5 tickets soporte
  await prisma.pd_tickets.createMany({ data: [
    { codigo: 'TK-2026-0001', titulo: 'Error 500 al generar facturas', descripcion: 'El módulo de facturación falla en producción.', tipo: 'soporte', id_categoria: catFacturacion.id, id_estado: estadoProgreso.id, id_complejidad: compAlta.id, id_area: areaSistemas.id, id_asignado: userAdmin.id, id_creador: userTecnico.id, fecha_limite: new Date(Date.now() + 3 * 86400000) },
    { codigo: 'TK-2026-0002', titulo: 'Pasarela de pagos rechaza tarjetas Visa', descripcion: 'Clientes reportan fallo al pagar con Visa.', tipo: 'soporte', id_categoria: catPasarela.id, id_estado: estadoAbierto.id, id_complejidad: compAlta.id, id_area: areaSistemas.id, id_creador: userTecnico.id, fecha_limite: new Date(Date.now() + 1 * 86400000) },
    { codigo: 'TK-2026-0003', titulo: 'PQRS sin respuesta hace 5 días', descripcion: 'Caso abierto sin asignado desde el lunes.', tipo: 'soporte', id_categoria: catPQRS.id, id_estado: estadoAbierto.id, id_complejidad: compMedia.id, id_area: areaRRHH.id, id_creador: userAdmin.id, fecha_limite: new Date(Date.now() + 2 * 86400000) },
    { codigo: 'TK-2026-0004', titulo: 'Reclamo lote vencido bodega norte', descripcion: 'Producto vencido detectado en inventario.', tipo: 'soporte', id_categoria: catReclamos.id, id_estado: estadoRevision.id, id_complejidad: compBaja.id, id_area: areaRRHH.id, id_asignado: userAdmin.id, id_creador: userTecnico.id, fecha_limite: new Date(Date.now() + 4 * 86400000) },
    { codigo: 'TK-2026-0005', titulo: 'Soporte TI — equipos sin acceso a red', descripcion: 'Piso 3 sin conectividad desde las 8am.', tipo: 'soporte', id_categoria: catSoporteTI.id, id_estado: estadoProgreso.id, id_complejidad: compMedia.id, id_area: areaSistemas.id, id_asignado: userAdmin.id, id_creador: userAdmin.id, fecha_limite: new Date(Date.now() + 1 * 86400000) },
    // 5 tickets proyecto
    { codigo: 'TK-2026-0006', titulo: 'Migración a microservicios fase 1', descripcion: 'Separar módulo de auth del monolito.', tipo: 'proyecto', id_categoria: catDesarrollo.id, id_estado: estadoProgreso.id, id_lista: listaEnDesarrollo.id, id_complejidad: compAlta.id, id_area: areaSistemas.id, id_asignado: userAdmin.id, id_creador: userAdmin.id, fecha_limite: new Date(Date.now() + 30 * 86400000) },
    { codigo: 'TK-2026-0007', titulo: 'Integración Marketplace B2B', descripcion: 'Conectar catálogo con plataforma mayorista.', tipo: 'proyecto', id_categoria: catIntegraciones.id, id_estado: estadoAbierto.id, id_lista: listaPorHacer.id, id_complejidad: compAlta.id, id_area: areaSistemas.id, id_creador: userTecnico.id, fecha_limite: new Date(Date.now() + 20 * 86400000) },
    { codigo: 'TK-2026-0008', titulo: 'Optimización de queries PostgreSQL', descripcion: 'Queries lentos en reportes gerenciales.', tipo: 'proyecto', id_categoria: catDB.id, id_estado: estadoAbierto.id, id_lista: listaBacklog.id, id_complejidad: compMedia.id, id_area: areaSistemas.id, id_creador: userAdmin.id, fecha_limite: new Date(Date.now() + 15 * 86400000) },
    { codigo: 'TK-2026-0009', titulo: 'Renovación infraestructura servidor', descripcion: 'Migrar a servidor con 32GB RAM.', tipo: 'proyecto', id_categoria: catInfra.id, id_estado: estadoAbierto.id, id_lista: listaBacklog.id, id_complejidad: compMedia.id, id_area: areaSistemas.id, id_creador: userAdmin.id, fecha_limite: new Date(Date.now() + 45 * 86400000) },
    { codigo: 'TK-2026-0010', titulo: 'Plan estratégico Q4 2026', descripcion: 'Definir roadmap y KPIs para el último trimestre.', tipo: 'proyecto', id_categoria: catEstrategia.id, id_estado: estadoAbierto.id, id_lista: listaPorHacer.id, id_complejidad: compBaja.id, id_area: areaRRHH.id, id_creador: userAdmin.id, fecha_limite: new Date(Date.now() + 10 * 86400000) },
  ]});

  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => { console.error('❌ Error en el seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
