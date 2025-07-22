-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('GUN_THREAT', 'UNAUTHORISED_ACCESS', 'FACE_RECOGNISED', 'SUSPICIOUS_ACTIVITY', 'MOTION_DETECTION', 'EQUIPMENT_TAMPERING');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "cameras" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "CameraStatus" NOT NULL DEFAULT 'ONLINE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" SERIAL NOT NULL,
    "camera_id" INTEGER NOT NULL,
    "type" "IncidentType" NOT NULL,
    "ts_start" TIMESTAMP(3) NOT NULL,
    "ts_end" TIMESTAMP(3) NOT NULL,
    "thumbnail_url" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_camera_id_idx" ON "incidents"("camera_id");

-- CreateIndex
CREATE INDEX "incidents_ts_start_idx" ON "incidents"("ts_start");

-- CreateIndex
CREATE INDEX "incidents_resolved_idx" ON "incidents"("resolved");

-- CreateIndex
CREATE INDEX "incidents_type_idx" ON "incidents"("type");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_camera_id_fkey" FOREIGN KEY ("camera_id") REFERENCES "cameras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
