import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.goal.deleteMany()

  const goals = await prisma.goal.createMany({
    data: [
      {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Buy Porsche Cayenne',
        monthlyAmount: '500.00',
        goalAmount: '20000.00',
        selectedVaultName: 'USDC',
        selectedProtocol: 'yo-protocol',
      },
      {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Build rainy day fund',
        monthlyAmount: '300.00',
        goalAmount: '10000.00',
        selectedVaultName: 'CSUSDC',
        selectedProtocol: 'morpho-v1',
      },
    ],
  })

  console.log(`✅ Created ${goals.count} goals`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
