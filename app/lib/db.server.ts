// Singleton pattern for Prisma client to avoid multiple instances
declare global {
  var __prismaClient__: any | undefined
}

let prismaClient: any

async function createPrismaClient() {
  try {

    const { PrismaClient } = await import('../../generated/prisma/client')
    return new PrismaClient()
  } catch (error) {
    console.error('Failed to create PrismaClient:', error)
    throw new Error('Database connection failed')
  }
}

async function getDb() {
  if (process.env.NODE_ENV === 'production') {
    if (!prismaClient) {
      prismaClient = await createPrismaClient()
    }
    return prismaClient
  } else {
    // In development, use global to prevent multiple instances
    if (!global.__prismaClient__) {
      global.__prismaClient__ = await createPrismaClient()
    }
    return global.__prismaClient__
  }
}

export { getDb }
