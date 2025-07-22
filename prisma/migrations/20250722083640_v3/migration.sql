-- DropIndex
DROP INDEX "incidents_resolved_idx";

-- DropIndex
DROP INDEX "incidents_severity_idx";

-- DropIndex
DROP INDEX "incidents_ts_start_idx";

-- DropIndex
DROP INDEX "incidents_type_idx";

-- CreateIndex
CREATE INDEX "incidents_resolved_severity_type_ts_start_idx" ON "incidents"("resolved", "severity", "type", "ts_start");
