/**
 * Upload remaining files and update database with correct IDs
 */

import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const ASSETS_BASE = 'C:\\Users\\matt\\Desktop\\stealth machine\\stealth_machine_tools_app\\assets\\support_materials';

// Mapping of DATABASE IDs to local file paths
const materialFiles: Record<string, string> = {
  // Already uploaded - skip these
  // 'airtac-pressure-gauge': already done
  // 'aventics-proportional-valve': already done
  // etc...
  
  // Need to upload with correct DB IDs
  'sl3015-machine-notes': 'manuals\\SL_3015_Machine_Notes_Updated.pdf',
  'ac-automatic-manual': 'manuals\\ac automatic.pdf',
  'blt310-manual': 'manuals\\BLT310-English.pdf',
  'blt421s-manual': 'manuals\\BLT421S-Proudct-Manul-V1.01.pdf',
  'cypcut-e-manual': 'manuals\\CypCutE-User-Manual-7.0-2.pdf',
  'cypnest-manual': 'manuals\\CypNest-User-Manual_En-1.pdf',
  'fscut4000e-installation': 'manuals\\FSCUT4000E-Installation-Manual-V1.3.pdf',
  'cutting-quality-troubleshooting': 'troubleshooting\\while cutting is not good, what need to chec.pdf',
  'blt-lens-temperature-faq': 'manuals\\BLT-Lower-Protective-Lens-Temperature-alarm-FAQ.pdf',
};

async function uploadAndUpdate(materialId: string, relativePath: string): Promise<boolean> {
  const fullPath = path.join(ASSETS_BASE, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ✗ File not found: ${fullPath}`);
    return false;
  }
  
  try {
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
    
    // Update database
    await prisma.supportMaterial.update({
      where: { id: materialId },
      data: { fileUrl: blob.url },
    });
    
    console.log(`  ✓ ${materialId} -> ${blob.url}\n`);
    return true;
  } catch (error: any) {
    console.log(`  ✗ ${materialId}: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 Uploading remaining materials...\n');
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN not set');
    process.exit(1);
  }
  
  let success = 0;
  let failed = 0;
  
  for (const [id, filePath] of Object.entries(materialFiles)) {
    const result = await uploadAndUpdate(id, filePath);
    if (result) success++;
    else failed++;
  }
  
  console.log(`\n📊 Summary: ${success} successful, ${failed} failed`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
