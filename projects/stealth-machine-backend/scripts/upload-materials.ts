/**
 * Upload all support materials to Vercel Blob storage
 * 
 * Usage:
 * 1. Get your Vercel Blob token from: https://vercel.com/dashboard/stores
 * 2. Set BLOB_READ_WRITE_TOKEN in .env
 * 3. Run: npx tsx scripts/upload-materials.ts
 */

import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Absolute path to assets folder
const ASSETS_BASE = 'C:\\Users\\matt\\Desktop\\stealth machine\\stealth_machine_tools_app\\assets\\support_materials';

// Map of material IDs to local file paths (relative to ASSETS_BASE)
const materialFiles: Record<string, string> = {
  // Manuals
  'airtac-pressure-gauge': 'manuals\\Airtac digital pressure gauge--DPS-Series-digital-display-pressure-sensor.pdf',
  'aventics-proportional-valve': 'manuals\\AVENTICS 614 series proportional valve manual.pdf',
  'diy-fiber-laser-install': 'manuals\\DIY_Fiber_Laser_Install_Guide_Final.pdf',
  'fiber-laser-consumables': 'manuals\\Fiber Laser Consumables and Assist Gas .pdf',
  'inovance-servo-guide': 'manuals\\Inovance_SV630N_Series_Servo_Drive_User_Guide.pdf',
  'sl-3015-machine-notes': 'manuals\\SL_3015_Machine_Notes_Updated.pdf',
  'transformer-manual': 'manuals\\Transformer manual.pdf',
  'gearbox-installation': 'manuals\\Installation instructions for gearbox.pdf',
  'ac-automatic': 'manuals\\ac automatic.pdf',
  
  // BLT Manuals
  'blt310-english': 'manuals\\BLT310-English.pdf',
  'blt310-product-manual': 'manuals\\BLT310-Proudct-Manul-V1.0.pdf',
  'blt310-lens-replacement': 'manuals\\BLT310 Collimating&Focusing Cartridge&Lens Replacement Guide.pdf',
  'blt421s-product-manual': 'manuals\\BLT421S-Proudct-Manul-V1.01.pdf',
  'blt4-lens-replacement': 'manuals\\BLT4 Series Intelligent Cutting Head Collimating_Focusing Cartridge_ Lens Replacement Guide v1.1.pdf',
  'blt4-window-replacement': 'manuals\\BLT4 Series Intelligent Cutting Head Lower and Second Lower Protective Window Cartridge Replacement Guide V1.0.pdf',
  'boci-blt-brochure': 'manuals\\【BOCI】BLT-intelligent-cutting-head-Brochure.pdf',
  
  // BLT FAQ
  'blt-alignment-faq': 'manuals\\BLT-Alignment-Paper-Detection-Function-Application-edition-FAQ.pdf',
  'blt-cutting-gas-faq': 'manuals\\BLT-Cutting-Gas-related-alarms-FAQ.pdf',
  'blt-sensor-faq': 'manuals\\BLT-Functional-Sensor-Applications-FAQ.pdf',
  'blt-lens-temp-faq': 'manuals\\BLT-Lower-Protective-Lens-Temperature-alarm-FAQ.pdf',
  
  // CypCut
  'cypcut-user-manual': 'manuals\\CypCutE-User-Manual-7.0-2.pdf',
  'cypnest-user-manual': 'manuals\\CypNest-User-Manual_En-1.pdf',
  
  // FSCUT
  'fscut2000e-manual': 'manuals\\FSCUT2000E-Installation-User-ManualV1.0.pdf',
  'fscut4000e-manual': 'manuals\\FSCUT4000E-Installation-Manual-V1.3.pdf',
  
  // Schematics
  'blt310-schematic': 'schematics\\BLT310 Schematic diagram of laser head.png',
  'blt421-schematic': 'schematics\\BLT421 Schematic diagram of laser head.png',
  
  // Troubleshooting
  'cutting-quality-check': 'troubleshooting\\while cutting is not good, what need to chec.pdf',
  
  // Contracts
  'contract-english': 'contracts\\Contract_English_Hou.pdf',
  'contract-chinese': 'contracts\\Contract_Chinese.pdf',
  'nda-english': 'contracts\\NDA_English.pdf',
  'nda-chinese': 'contracts\\NDA_Chinese.pdf',
  'independent-contractor': 'manuals\\Independent_Contractor_Agreement.pdf',
};

async function uploadFile(relativePath: string): Promise<string> {
  const fullPath = path.join(ASSETS_BASE, relativePath);
  
  console.log(`  Looking for: ${fullPath}`);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  
  const fileBuffer = fs.readFileSync(fullPath);
  const fileName = path.basename(relativePath);
  const blobPath = `support-materials/${fileName}`;
  
  const contentType = relativePath.endsWith('.pdf') ? 'application/pdf' : 
                      relativePath.endsWith('.png') ? 'image/png' : 
                      'application/octet-stream';
  
  console.log(`  Uploading: ${fileName}...`);
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType,
  });
  
  return blob.url;
}

async function main() {
  console.log('🚀 Starting material upload to Vercel Blob...\n');
  console.log(`📁 Assets folder: ${ASSETS_BASE}\n`);
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN not set in .env');
    process.exit(1);
  }
  
  // First, list what files actually exist
  console.log('📋 Checking available files...\n');
  
  const results: { id: string; url: string; success: boolean; error?: string }[] = [];
  
  for (const [materialId, relativePath] of Object.entries(materialFiles)) {
    try {
      const url = await uploadFile(relativePath);
      
      // Update database
      await prisma.supportMaterial.update({
        where: { id: materialId },
        data: { fileUrl: url },
      });
      
      results.push({ id: materialId, url, success: true });
      console.log(`  ✓ ${materialId}\n    URL: ${url}\n`);
    } catch (error: any) {
      results.push({ id: materialId, url: '', success: false, error: error.message });
      console.log(`  ✗ ${materialId}: ${error.message}\n`);
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Upload Summary:');
  console.log(`   ✓ Successful: ${successful}`);
  console.log(`   ✗ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed uploads:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.id}`);
    });
  }
  
  if (successful > 0) {
    console.log('\n✅ Successful uploads:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   - ${r.id}: ${r.url}`);
    });
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
