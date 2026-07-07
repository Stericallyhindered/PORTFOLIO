import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating AI model configuration...');
  
  // Update the model in AIConfig
  const updated = await prisma.aIConfig.updateMany({
    where: { key: 'model' },
    data: { value: 'claude-sonnet-4-5-20250929' },
  });
  
  console.log(`Updated ${updated.count} AIConfig record(s)`);
  
  // Verify the update
  const config = await prisma.aIConfig.findFirst({
    where: { key: 'model' },
  });
  
  console.log('Current model config:', config);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
