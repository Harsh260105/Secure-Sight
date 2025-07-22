import { PrismaClient } from "@prisma/client"

// Singleton pattern for Prisma client to prevent multiple instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Remove console logging for production
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Type exports for frontend use - all types come from Prisma
export type {
  Camera,
  Incident,
  CameraStatus,
  IncidentType,
  Severity,
} from "@prisma/client"

// Extended types for API responses with relations
export type CameraWithIncidentCount = {
  id: number
  name: string
  location: string
  status: string
  createdAt: Date
  updatedAt: Date
  _count: {
    incidents: number
  }
}

export type IncidentWithCamera = {
  id: number
  cameraId: number
  type: string
  tsStart: Date
  tsEnd: Date
  thumbnailUrl: string
  resolved: boolean
  severity: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  camera: {
    id: number
    name: string
    location: string
    status: string
  }
}

/**
 * DatabaseService - Centralized database operations using Prisma
 * All database interactions in the application go through this service
 */
export class DatabaseService {
  /**
   * Get all cameras with incident counts
   */
  static async getCameras(): Promise<CameraWithIncidentCount[]> {
    try {
      return await prisma.camera.findMany({
        include: {
          _count: {
            select: { incidents: true },
          },
        },
        orderBy: { name: "asc" },
      })
    } catch (error) {
      console.error("DatabaseService.getCameras error:", error)
      throw new Error("Failed to fetch cameras")
    }
  }

  /**
   * Get all incidents with camera information (no filtering - let frontend handle it)
   */
  static async getAllIncidents(): Promise<IncidentWithCamera[]> {
    try {
      return await prisma.incident.findMany({
        include: {
          camera: {
            select: {
              id: true,
              name: true,
              location: true,
              status: true,
            },
          },
        },
        orderBy: { tsStart: "desc" },
      })
    } catch (error) {
      console.error("DatabaseService.getAllIncidents error:", error)
      throw new Error("Failed to fetch incidents")
    }
  }

  /**
   * Get incidents with optional filtering by resolution status (kept for backward compatibility)
   */
  static async getIncidents(resolved?: boolean): Promise<IncidentWithCamera[]> {
    try {
      return await prisma.incident.findMany({
        where: resolved !== undefined ? { resolved } : undefined,
        include: {
          camera: {
            select: {
              id: true,
              name: true,
              location: true,
              status: true,
            },
          },
        },
        orderBy: { tsStart: "desc" },
      })
    } catch (error) {
      console.error("DatabaseService.getIncidents error:", error)
      throw new Error("Failed to fetch incidents")
    }
  }

  /**
   * Get incidents within a specific time range for timeline view
   */
  static async getIncidentsByTimeRange(startTime: Date, endTime: Date): Promise<IncidentWithCamera[]> {
    try {
      return await prisma.incident.findMany({
        where: {
          tsStart: {
            gte: startTime,
            lte: endTime,
          },
        },
        include: {
          camera: {
            select: {
              id: true,
              name: true,
              location: true,
              status: true,
            },
          },
        },
        orderBy: { tsStart: "asc" },
      })
    } catch (error) {
      console.error("DatabaseService.getIncidentsByTimeRange error:", error)
      throw new Error("Failed to fetch incidents by time range")
    }
  }

  /**
   * Toggle incident resolution status
   */
  static async resolveIncident(incidentId: number): Promise<IncidentWithCamera> {
    try {
      // First get the current incident to toggle its status
      const currentIncident = await prisma.incident.findUnique({
        where: { id: incidentId },
        select: { resolved: true },
      })

      if (!currentIncident) {
        throw new Error("Incident not found")
      }

      // Update the incident with toggled resolution status
      return await prisma.incident.update({
        where: { id: incidentId },
        data: { resolved: !currentIncident.resolved },
        include: {
          camera: {
            select: {
              id: true,
              name: true,
              location: true,
              status: true,
            },
          },
        },
      })
    } catch (error) {
      console.error("DatabaseService.resolveIncident error:", error)
      if (error.message === "Incident not found") {
        throw error
      }
      throw new Error("Failed to resolve incident")
    }
  }

  /**
   * Get timeline data for the last 24 hours
   */
  static async getTimelineData(): Promise<IncidentWithCamera[]> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const today = new Date()

      return await this.getIncidentsByTimeRange(yesterday, today)
    } catch (error) {
      console.error("DatabaseService.getTimelineData error:", error)
      throw new Error("Failed to fetch timeline data")
    }
  }

  /**
   * Get comprehensive dashboard statistics
   */
  static async getIncidentStats() {
    try {
      const [totalIncidents, unresolvedIncidents, criticalIncidents, incidentsByType, incidentsBySeverity] =
        await Promise.all([
          prisma.incident.count(),
          prisma.incident.count({ where: { resolved: false } }),
          prisma.incident.count({ where: { severity: "CRITICAL" } }),
          prisma.incident.groupBy({
            by: ["type"],
            _count: { type: true },
            orderBy: { _count: { type: "desc" } },
          }),
          prisma.incident.groupBy({
            by: ["severity"],
            _count: { severity: true },
            orderBy: { _count: { severity: "desc" } },
          }),
        ])

      return {
        totalIncidents,
        unresolvedIncidents,
        criticalIncidents,
        incidentsByType,
        incidentsBySeverity,
      }
    } catch (error) {
      console.error("DatabaseService.getIncidentStats error:", error)
      throw new Error("Failed to fetch incident statistics")
    }
  }

  /**
   * Update camera status
   */
  static async updateCameraStatus(cameraId: number, status: "ONLINE" | "OFFLINE" | "MAINTENANCE") {
    try {
      return await prisma.camera.update({
        where: { id: cameraId },
        data: { status },
      })
    } catch (error) {
      console.error("DatabaseService.updateCameraStatus error:", error)
      throw new Error("Failed to update camera status")
    }
  }

  /**
   * Health check - verify database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error("DatabaseService.healthCheck error:", error)
      return false
    }
  }

  /**
   * Get database connection info for debugging
   */
  static async getConnectionInfo() {
    try {
      const result = (await prisma.$queryRaw`SELECT version()`) as Array<{ version: string }>
      return {
        connected: true,
        version: result[0]?.version || "Unknown",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error("DatabaseService.getConnectionInfo error:", error)
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }
}

// Export prisma client for direct use if needed (discouraged - use DatabaseService instead)
export { prisma as default }
