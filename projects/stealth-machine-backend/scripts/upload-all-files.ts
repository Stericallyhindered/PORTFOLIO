/**
 * Upload ALL files from assets folder and create/update database entries
 */

import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const ASSETS_BASE = 'C:\\Users\\matt\\Desktop\\stealth machine\\stealth_machine_tools_app\\assets\\support_materials';

// All files that need to be uploaded with their metadata
const allFiles = [
  // Manuals
  { id: 'boci-blt-brochure', file: 'manuals\\【BOCI】BLT-intelligent-cutting-head-Brochure.pdf', title: 'BOCI BLT Intelligent Cutting Head Brochure', category: 'manuals', type: 'pdf' },
  { id: 'blt-sensor-faq', file: 'manuals\\BLT-Functional-Sensor-Applications-FAQ.pdf', title: 'BLT Functional Sensor Applications FAQ', category: 'manuals', type: 'pdf' },
  { id: 'blt4-lens-replacement', file: 'manuals\\BLT4 Series Intelligent Cutting Head Collimating_Focusing Cartridge_ Lens Replacement Guide v1.1.pdf', title: 'BLT4 Series Lens Replacement Guide', category: 'manuals', type: 'pdf' },
  { id: 'blt4-window-replacement', file: 'manuals\\BLT4 Series Intelligent Cutting Head Lower and Second Lower Protective Window Cartridge Replacement Guide V1.0.pdf', title: 'BLT4 Series Window Replacement Guide', category: 'manuals', type: 'pdf' },
  { id: 'fscut2000e-manual', file: 'manuals\\FSCUT2000E-Installation-User-ManualV1.0.pdf', title: 'FSCUT2000E Installation Manual', category: 'manuals', type: 'pdf' },
  { id: 'independent-contractor', file: 'manuals\\Independent_Contractor_Agreement.pdf', title: 'Independent Contractor Agreement', category: 'contracts', type: 'pdf' },
  
  // Contracts - NDA files
  { id: 'nda-english', file: 'contracts\\NDA_English.pdf', title: 'NDA (English)', category: 'contracts', type: 'pdf' },
  { id: 'nda-chinese', file: 'contracts\\NDA_Chinese.pdf', title: 'NDA (Chinese)', category: 'contracts', type: 'pdf' },
];

async function uploadFile(relativePath: string): Promise<string> {
  const fullPath = path.join(ASSETS_BASE, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  
  const fileBuffer = fs.readFileSync(fullPath);
  const fileName = path.basename(relativePath);
  const blobPath = `support-materials/${fileName}`;
  
  const contentType = relativePath.endsWith('.pdf') ? 'application/pdf' : 
                      relativePath.endsWith('.png') ? 'image/png' : 
                      'application/octet-stream';
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType,
  });
  
  return blob.url;
}

async function main() {
  console.log('🚀 Uploading all remaining files and creating DB entries...\n');
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN not set');
    process.exit(1);
  }
  
  // Get category IDs
  const categories = await prisma.materialCategory.findMany();
  const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
  
  console.log('Categories found:', Array.from(categoryMap.keys()));
  
  let success = 0;
  let failed = 0;
  
  for (const item of allFiles) {
    try {
      console.log(`\n📄 Processing: ${item.title}`);
      console.log(`   File: ${item.file}`);
      
      // Upload file
      const url = await uploadFile(item.file);
      console.log(`   ✓ Uploaded: ${url}`);
      
      // Check if exists in DB
      const existing = await prisma.supportMaterial.findUnique({
        where: { id: item.id }
      });
      
      const categoryId = categoryMap.get(item.category);
      
      if (existing) {
        // Update existing
        await prisma.supportMaterial.update({
          where: { id: item.id },
          data: { fileUrl: url }
        });
        console.log(`   ✓ Updated existing DB entry`);
      } else {
        // Create new
        await prisma.supportMaterial.create({
          data: {
            id: item.id,
            title: item.title,
            description: item.title,
            fileType: item.type.toUpperCase() as any,
            fileUrl: url,
            categoryId: categoryId || categories[0].id,
            isPublished: true,
          }
        });
        console.log(`   ✓ Created new DB entry`);
      }
      
      success++;
    } catch (error: any) {
      console.log(`   ✗ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n\n📊 Summary: ${success} successful, ${failed} failed`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
