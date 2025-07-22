import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function GET() {
  try {
    const connectionInfo = await DatabaseService.getConnectionInfo()
    const isHealthy = await DatabaseService.healthCheck()

    return NextResponse.json({
      status: isHealthy ? "healthy" : "unhealthy",
      database: connectionInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
