import { PrismaClient, CameraStatus, IncidentType, Severity } from "@prisma/client"

const prisma = new PrismaClient({
  // Minimal logging for seed script
  log: ["error"],
})

async function main() {
  console.log("🌱 Starting database seed...")

  try {
    // Test database connection first
    console.log("🔗 Testing database connection...")
    await prisma.$connect()
    console.log("✅ Database connection successful")

    // Clean existing data (optional - remove in production)
    console.log("🧹 Cleaning existing data...")
    await prisma.incident.deleteMany()
    await prisma.camera.deleteMany()
    console.log("✅ Existing data cleaned")

    console.log("📹 Creating cameras...")

    // Create cameras one by one with error handling
    const cameraData = [
      {
        name: "Shop Floor A",
        location: "Main Production Area",
        status: CameraStatus.ONLINE,
      },
      {
        name: "Vault Camera",
        location: "Security Vault - Level B1",
        status: CameraStatus.ONLINE,
      },
      {
        name: "Main Entrance",
        location: "Building Entrance - Ground Floor",
        status: CameraStatus.ONLINE,
      },
      {
        name: "Parking Lot",
        location: "Employee Parking Area",
        status: CameraStatus.ONLINE,
      },
      {
        name: "Server Room",
        location: "IT Infrastructure - Level 2",
        status: CameraStatus.MAINTENANCE,
      },
    ]

    const cameras = []
    for (const camera of cameraData) {
      try {
        const createdCamera = await prisma.camera.create({
          data: camera,
        })
        cameras.push(createdCamera)
        console.log(`✅ Created camera: ${camera.name}`)
      } catch (error) {
        console.error(`❌ Failed to create camera ${camera.name}:`, error)
        throw error
      }
    }

    console.log(`✅ Created ${cameras.length} cameras`)

    console.log("🚨 Creating incidents...")

    // Helper function to create incident data
    const createIncidentData = (
      cameraId: number,
      type: IncidentType,
      startHour: number,
      startMinute: number,
      durationMinutes: number,
      severity: Severity,
      resolved: boolean,
      description: string,
    ) => {
      const tsStart = new Date("2024-01-21")
      tsStart.setHours(startHour, startMinute, 0, 0)

      const tsEnd = new Date(tsStart)
      tsEnd.setMinutes(tsEnd.getMinutes() + durationMinutes)

      return {
        cameraId,
        type,
        tsStart,
        tsEnd,
        thumbnailUrl: `https://images.unsplash.com/photo-${getImageId(type)}?w=160&h=120&fit=crop`,
        severity,
        resolved,
        description,
      }
    }

    // Helper function to get appropriate Unsplash image IDs
    function getImageId(type: IncidentType): string {
      const imageMap = {
        [IncidentType.GUN_THREAT]: "1516321318423-f06f85e504b3",
        [IncidentType.UNAUTHORISED_ACCESS]: "1560472354-b33ff0c44a43",
        [IncidentType.FACE_RECOGNISED]: "1507003211169-0a1dd7228f2d",
        [IncidentType.SUSPICIOUS_ACTIVITY]: "1441986300917-64674bd600d8",
        [IncidentType.MOTION_DETECTION]: "1504384308090-c894fdcc538d",
        [IncidentType.EQUIPMENT_TAMPERING]: "1581092160562-40aa08e78837",
      }
      return imageMap[type]
    }

    // Create comprehensive incident data across 24 hours
    const incidentData = [
      // Early Morning (00:00 - 06:00)
      createIncidentData(
        cameras[3].id, // Parking Lot
        IncidentType.MOTION_DETECTION,
        0,
        45,
        2,
        Severity.LOW,
        false,
        "Vehicle movement detected in parking area",
      ),
      createIncidentData(
        cameras[4].id, // Server Room
        IncidentType.UNAUTHORISED_ACCESS,
        1,
        20,
        5,
        Severity.HIGH,
        false,
        "Attempted access to server room after hours",
      ),
      createIncidentData(
        cameras[0].id, // Shop Floor A
        IncidentType.GUN_THREAT,
        2,
        15,
        5,
        Severity.CRITICAL,
        false,
        "Weapon detected on shop floor",
      ),
      createIncidentData(
        cameras[2].id, // Main Entrance
        IncidentType.SUSPICIOUS_ACTIVITY,
        3,
        30,
        5,
        Severity.MEDIUM,
        true,
        "Unusual behavior patterns detected",
      ),
      createIncidentData(
        cameras[1].id, // Vault Camera
        IncidentType.FACE_RECOGNISED,
        4,
        10,
        1,
        Severity.LOW,
        true,
        "Authorized personnel identified",
      ),
      createIncidentData(
        cameras[3].id, // Parking Lot
        IncidentType.EQUIPMENT_TAMPERING,
        5,
        45,
        5,
        Severity.HIGH,
        false,
        "Interference with parking security equipment",
      ),

      // Morning (06:00 - 12:00)
      createIncidentData(
        cameras[0].id,
        IncidentType.MOTION_DETECTION,
        6,
        15,
        1,
        Severity.LOW,
        true,
        "Normal shift change activity",
      ),
      createIncidentData(
        cameras[2].id,
        IncidentType.FACE_RECOGNISED,
        7,
        30,
        1,
        Severity.LOW,
        true,
        "Employee arrival logged",
      ),
      createIncidentData(
        cameras[1].id,
        IncidentType.UNAUTHORISED_ACCESS,
        8,
        45,
        3,
        Severity.MEDIUM,
        false,
        "Access attempt to restricted vault area",
      ),
      createIncidentData(
        cameras[3].id,
        IncidentType.EQUIPMENT_TAMPERING,
        9,
        20,
        5,
        Severity.MEDIUM,
        true,
        "Maintenance work on security systems",
      ),
      createIncidentData(
        cameras[4].id,
        IncidentType.SUSPICIOUS_ACTIVITY,
        10,
        30,
        5,
        Severity.MEDIUM,
        false,
        "Unusual server room activity patterns",
      ),
      createIncidentData(
        cameras[0].id,
        IncidentType.FACE_RECOGNISED,
        11,
        15,
        1,
        Severity.LOW,
        true,
        "Supervisor identification confirmed",
      ),

      // Afternoon (12:00 - 18:00)
      createIncidentData(
        cameras[2].id,
        IncidentType.MOTION_DETECTION,
        12,
        30,
        2,
        Severity.LOW,
        false,
        "Lunch break movement patterns",
      ),
      createIncidentData(
        cameras[1].id,
        IncidentType.GUN_THREAT,
        13,
        45,
        5,
        Severity.CRITICAL,
        false,
        "Potential weapon detected near vault",
      ),
      createIncidentData(
        cameras[3].id,
        IncidentType.UNAUTHORISED_ACCESS,
        14,
        20,
        5,
        Severity.HIGH,
        false,
        "Unauthorized vehicle in restricted parking",
      ),
      createIncidentData(
        cameras[4].id,
        IncidentType.FACE_RECOGNISED,
        15,
        10,
        1,
        Severity.LOW,
        true,
        "IT staff access logged",
      ),
      createIncidentData(
        cameras[0].id,
        IncidentType.SUSPICIOUS_ACTIVITY,
        16,
        30,
        5,
        Severity.MEDIUM,
        false,
        "Unusual production floor activity",
      ),
      createIncidentData(
        cameras[2].id,
        IncidentType.EQUIPMENT_TAMPERING,
        17,
        45,
        3,
        Severity.LOW,
        true,
        "Scheduled maintenance completed",
      ),

      // Evening (18:00 - 24:00)
      createIncidentData(
        cameras[1].id,
        IncidentType.MOTION_DETECTION,
        18,
        15,
        2,
        Severity.LOW,
        false,
        "End of shift activity",
      ),
      createIncidentData(
        cameras[3].id,
        IncidentType.UNAUTHORISED_ACCESS,
        19,
        30,
        5,
        Severity.HIGH,
        false,
        "After-hours parking lot breach",
      ),
      createIncidentData(
        cameras[4].id,
        IncidentType.GUN_THREAT,
        20,
        45,
        5,
        Severity.CRITICAL,
        false,
        "Security threat in server room area",
      ),
      createIncidentData(
        cameras[0].id,
        IncidentType.FACE_RECOGNISED,
        21,
        20,
        1,
        Severity.LOW,
        true,
        "Night security guard identified",
      ),
      createIncidentData(
        cameras[2].id,
        IncidentType.SUSPICIOUS_ACTIVITY,
        22,
        10,
        5,
        Severity.MEDIUM,
        false,
        "Unusual entrance area activity",
      ),
      createIncidentData(
        cameras[1].id,
        IncidentType.EQUIPMENT_TAMPERING,
        23,
        30,
        5,
        Severity.MEDIUM,
        true,
        "Security system calibration",
      ),
    ]

    // Insert incidents in smaller batches with error handling
    const batchSize = 5
    let createdIncidents = 0

    for (let i = 0; i < incidentData.length; i += batchSize) {
      const batch = incidentData.slice(i, i + batchSize)

      try {
        // Create incidents one by one for better error handling
        for (const incident of batch) {
          await prisma.incident.create({
            data: incident,
          })
          createdIncidents++
        }

        console.log(`📊 Created ${createdIncidents}/${incidentData.length} incidents...`)
      } catch (error) {
        console.error(`❌ Error creating incident batch ${i / batchSize + 1}:`, error)
        throw error
      }
    }

    console.log(`✅ Created ${createdIncidents} incidents`)

    // Display summary
    const totalCameras = await prisma.camera.count()
    const totalIncidents = await prisma.incident.count()
    const unresolvedIncidents = await prisma.incident.count({
      where: { resolved: false },
    })
    const criticalIncidents = await prisma.incident.count({
      where: { severity: Severity.CRITICAL },
    })

    console.log("\n📈 Database Summary:")
    console.log(`   Cameras: ${totalCameras}`)
    console.log(`   Total Incidents: ${totalIncidents}`)
    console.log(`   Unresolved Incidents: ${unresolvedIncidents}`)
    console.log(`   Critical Incidents: ${criticalIncidents}`)
    console.log("\n🎉 Database seeded successfully!")
  } catch (error) {
    console.error("❌ Error during seeding:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    console.log("🔌 Disconnecting from database...")
    await prisma.$disconnect()
  })
