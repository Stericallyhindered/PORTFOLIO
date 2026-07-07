/**
 * Create database entries for uploaded files
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Files already uploaded to Vercel Blob - just need DB entries
const newMaterials = [
  { 
    id: 'boci-blt-brochure', 
    title: 'BOCI BLT Intelligent Cutting Head Brochure',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/%E3%80%90BOCI%E3%80%91BLT-intelligent-cutting-head-Brochure-LYMa7PC5SSSZSVeJnm2eidzd5l5nGk.pdf',
    category: 'manuals'
  },
  { 
    id: 'blt-sensor-faq', 
    title: 'BLT Functional Sensor Applications FAQ',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/BLT-Functional-Sensor-Applications-FAQ-ddmYKmAWEAWOJiGwnP86hzd70skftB.pdf',
    category: 'manuals'
  },
  { 
    id: 'blt4-lens-replacement', 
    title: 'BLT4 Series Lens Replacement Guide',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/BLT4%20Series%20Intelligent%20Cutting%20Head%20Collimating_Focusing%20Cartridge_%20Lens%20Replacement%20Guide%20v1.1-p2dpWNfaqddQQ957f0Ci6F20cFrC04.pdf',
    category: 'manuals'
  },
  { 
    id: 'blt4-window-replacement', 
    title: 'BLT4 Series Window Replacement Guide',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/BLT4%20Series%20Intelligent%20Cutting%20Head%20Lower%20and%20Second%20Lower%20Protective%20Window%20Cartridge%20Replacement%20Guide%20V1.0-nq6KjKxQ92lcOUkvrTSL0OhNGY4BlT.pdf',
    category: 'manuals'
  },
  { 
    id: 'fscut2000e-manual', 
    title: 'FSCUT2000E Installation Manual',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/FSCUT2000E-Installation-User-ManualV1.0-rBArbM3g4rAy1DY7OOptPEfouXfbhk.pdf',
    category: 'manuals'
  },
  { 
    id: 'independent-contractor', 
    title: 'Independent Contractor Agreement',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/Independent_Contractor_Agreement-eYpfnittXKF2ysaouwcuasMrAs1JnA.pdf',
    category: 'contracts'
  },
  { 
    id: 'nda-english', 
    title: 'NDA (English)',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/NDA_English-ETcLDmfLXJeJnRd7Bty33OieDXZqcg.pdf',
    category: 'contracts'
  },
  { 
    id: 'nda-chinese', 
    title: 'NDA (Chinese)',
    fileUrl: 'https://xnjj5hkjjvsc4luk.public.blob.vercel-storage.com/support-materials/NDA_Chinese-snAXO5HlUmxx8IYiJUz88m4pORx614.pdf',
    category: 'contracts'
  },
];

async function main() {
  console.log('🚀 Creating database entries for uploaded files...\n');
  
  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });
  
  if (!adminUser) {
    console.error('❌ No admin user found');
    process.exit(1);
  }
  console.log(`Admin user: ${adminUser.email} (${adminUser.id})\n`);
  
  // Get categories
  const categories = await prisma.materialCategory.findMany();
  console.log('Available categories:');
  categories.forEach(c => console.log(`  - ${c.name}: ${c.id}`));
  
  const categoryMap = new Map(categories.map(c => [c.name, c.id]));
  
  let success = 0;
  let failed = 0;
  
  for (const item of newMaterials) {
    try {
      const categoryId = categoryMap.get(item.category);
      
      if (!categoryId) {
        console.log(`  ✗ ${item.id}: Category '${item.category}' not found`);
        failed++;
        continue;
      }
      
      // Extract filename from URL
      const urlParts = item.fileUrl.split('/');
      const fileName = decodeURIComponent(urlParts[urlParts.length - 1].split('-')[0]) + '.pdf';
      
      await prisma.supportMaterial.create({
        data: {
          id: item.id,
          title: item.title,
          description: item.title,
          category: item.category,
          fileType: 'pdf',
          fileName: fileName,
          fileUrl: item.fileUrl,
          fileSize: 0,
          isPublished: true,
          createdBy: adminUser.id
        }
      });
      
      console.log(`  ✓ Created: ${item.id}`);
      success++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`  ⚠ ${item.id}: Already exists`);
      } else {
        console.log(`  ✗ ${item.id}: ${error.message}`);
      }
      failed++;
    }
  }
  
  console.log(`\n📊 Summary: ${success} created, ${failed} skipped/failed`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
