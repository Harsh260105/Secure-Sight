import { prisma } from "@/lib/prisma"

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

export class SupabaseService {
  static subscribeToIncidents(callback: (payload: any) => void): { unsubscribe: () => void } {
    // Placeholder for real-time subscription logic
    console.warn("Real-time subscription is not implemented. Using a mock.")

    // Mock implementation: Call the callback every 5 seconds with a dummy payload
    const intervalId = setInterval(() => {
      const mockPayload = {
        event: "UPDATE",
        new: {
          id: Math.floor(Math.random() * 100),
          type: "MOTION_DETECTION",
          tsStart: new Date().toISOString(),
        },
      }
      callback(mockPayload)
    }, 5000)

    return {
      unsubscribe: () => {
        clearInterval(intervalId)
        console.log("Subscription unsubscribed.")
      },
    }
  }

  static async getTimelineData(): Promise<IncidentWithCamera[]> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const today = new Date()

      return (await prisma.incident.findMany({
        where: {
          tsStart: {
            gte: yesterday,
            lte: today,
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
      })) as IncidentWithCamera[]
    } catch (error) {
      console.error("Error fetching timeline data:", error)
      throw new Error("Failed to fetch timeline data")
    }
  }
}
