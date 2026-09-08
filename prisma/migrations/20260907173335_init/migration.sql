-- CreateTable
CREATE TABLE "pd_complejidades" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#9ca3af',
    "horas_estimadas" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pd_complejidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_estados" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    "es_final" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pd_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_areas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pd_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_tickets" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'soporte',
    "id_estado" INTEGER NOT NULL,
    "id_complejidad" INTEGER NOT NULL,
    "id_categoria" INTEGER,
    "id_area" INTEGER NOT NULL,
    "id_asignado" INTEGER,
    "id_creador" INTEGER NOT NULL,
    "fecha_limite" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pd_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "id_area" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pd_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_comentarios" (
    "id" SERIAL NOT NULL,
    "id_ticket" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "es_interno" BOOLEAN NOT NULL DEFAULT false,
    "id_padre" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pd_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_historial" (
    "id" SERIAL NOT NULL,
    "id_ticket" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "accion" VARCHAR(100) NOT NULL,
    "detalle" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pd_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_checklists" (
    "id" SERIAL NOT NULL,
    "id_ticket" INTEGER NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pd_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_tableros" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "id_area" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pd_tableros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_listas" (
    "id" SERIAL NOT NULL,
    "id_tablero" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "orden" INTEGER NOT NULL,
    "wip_limit" INTEGER,

    CONSTRAINT "pd_listas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pd_miembros_tablero" (
    "id" SERIAL NOT NULL,
    "id_tablero" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "rol" VARCHAR(20) NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pd_miembros_tablero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pd_tickets_codigo_key" ON "pd_tickets"("codigo");

-- CreateIndex
CREATE INDEX "pd_tickets_id_area_idx" ON "pd_tickets"("id_area");

-- CreateIndex
CREATE INDEX "pd_tickets_id_asignado_idx" ON "pd_tickets"("id_asignado");

-- CreateIndex
CREATE INDEX "pd_tickets_id_estado_idx" ON "pd_tickets"("id_estado");

-- CreateIndex
CREATE INDEX "pd_categorias_id_area_idx" ON "pd_categorias"("id_area");

-- CreateIndex
CREATE INDEX "pd_comentarios_id_ticket_idx" ON "pd_comentarios"("id_ticket");

-- CreateIndex
CREATE INDEX "pd_historial_id_ticket_idx" ON "pd_historial"("id_ticket");

-- CreateIndex
CREATE INDEX "pd_checklists_id_ticket_idx" ON "pd_checklists"("id_ticket");

-- CreateIndex
CREATE INDEX "pd_tableros_id_area_idx" ON "pd_tableros"("id_area");

-- CreateIndex
CREATE INDEX "pd_listas_id_tablero_idx" ON "pd_listas"("id_tablero");

-- CreateIndex
CREATE INDEX "pd_miembros_tablero_id_tablero_idx" ON "pd_miembros_tablero"("id_tablero");

-- CreateIndex
CREATE UNIQUE INDEX "pd_miembros_tablero_id_tablero_id_usuario_key" ON "pd_miembros_tablero"("id_tablero", "id_usuario");

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "pd_estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_complejidad_fkey" FOREIGN KEY ("id_complejidad") REFERENCES "pd_complejidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "pd_categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tickets" ADD CONSTRAINT "pd_tickets_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "pd_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_categorias" ADD CONSTRAINT "pd_categorias_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "pd_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_comentarios" ADD CONSTRAINT "pd_comentarios_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "pd_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_historial" ADD CONSTRAINT "pd_historial_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "pd_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_checklists" ADD CONSTRAINT "pd_checklists_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "pd_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_tableros" ADD CONSTRAINT "pd_tableros_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "pd_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_listas" ADD CONSTRAINT "pd_listas_id_tablero_fkey" FOREIGN KEY ("id_tablero") REFERENCES "pd_tableros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pd_miembros_tablero" ADD CONSTRAINT "pd_miembros_tablero_id_tablero_fkey" FOREIGN KEY ("id_tablero") REFERENCES "pd_tableros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
