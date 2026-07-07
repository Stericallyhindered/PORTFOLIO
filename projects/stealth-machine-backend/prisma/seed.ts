import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ==========================================================================
  // 1. CREATE ADMIN USER
  // ==========================================================================
  console.log('👤 Creating admin user...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@stealthmachinetools.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SMT_Admin_2024!';
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      company: 'Stealth Machine Tools',
    },
  });
  console.log(`   ✓ Admin user created: ${adminUser.email}`);

  // ==========================================================================
  // 2. CREATE MATERIAL CATEGORIES
  // ==========================================================================
  console.log('\n📁 Creating material categories...');
  
  const categories = [
    { name: 'manuals', displayName: 'Manuals & Guides', description: 'User manuals, installation guides, and documentation', icon: 'book', color: '#3B82F6' },
    { name: 'videos', displayName: 'Video Tutorials', description: 'Step-by-step video tutorials and demonstrations', icon: 'video', color: '#EF4444' },
    { name: 'schematics', displayName: 'Schematics & Diagrams', description: 'Technical schematics and diagrams', icon: 'file-text', color: '#10B981' },
    { name: 'troubleshooting', displayName: 'Troubleshooting', description: 'Troubleshooting guides and FAQ documents', icon: 'help-circle', color: '#F59E0B' },
    { name: 'contracts', displayName: 'Contracts & Templates', description: 'Contract templates and legal documents', icon: 'file', color: '#8B5CF6' },
  ];

  for (const cat of categories) {
    await prisma.materialCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: { ...cat, sortOrder: categories.indexOf(cat) },
    });
  }
  console.log(`   ✓ Created ${categories.length} categories`);

  // ==========================================================================
  // 3. CREATE SUPPORT MATERIALS (from Flutter hardcoded data)
  // ==========================================================================
  console.log('\n📚 Creating support materials...');
  
  const materials = [
    // Manuals
    { id: 'airtac-pressure-gauge', title: 'Airtac Digital Pressure Gauge Manual', description: 'DPS Series digital display pressure sensor manual and specifications', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Airtac-digital-pressure-gauge-DPS-Series-digital-display-pressure-sensor.pdf', machineModel: 'Pressure Gauge', tags: ['pressure', 'gauge', 'airtac', 'dps'] },
    { id: 'aventics-proportional-valve', title: 'AVENTICS 614 Series Proportional Valve Manual', description: 'Complete manual for AVENTICS 614 series proportional valve operation and maintenance', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/AVENTICS-614-series-proportional-valve-manual.pdf', machineModel: 'AVENTICS 614', tags: ['aventics', 'proportional', 'valve', '614'] },
    { id: 'diy-fiber-laser-install', title: 'DIY Fiber Laser Install Guide', description: 'Complete installation guide for DIY fiber laser systems', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/DIY_Fiber_Laser_Install_Guide_Final.pdf', machineModel: 'Fiber Laser', tags: ['fiber', 'laser', 'installation', 'diy'] },
    { id: 'fiber-laser-consumables', title: 'Fiber Laser Consumables and Assist Gas Guide', description: 'Guide for fiber laser consumables, assist gases, and maintenance', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Fiber-Laser-Consumables-and-Assist-Gas-.pdf', machineModel: 'Fiber Laser', tags: ['fiber', 'laser', 'consumables', 'gas'] },
    { id: 'inovance-servo-guide', title: 'Inovance SV630N Series Servo Drive User Guide', description: 'Complete user guide for Inovance SV630N series servo drive', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Inovance-《SV630N-Series-Servo-Drive-User-Guide》-EN-.pdf', machineModel: 'Inovance SV630N', tags: ['inovance', 'servo', 'drive', 'sv630n'] },
    { id: 'gearbox-installation', title: 'Installation Instructions for Gearbox', description: 'Step-by-step installation instructions for gearbox assembly', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Installation-instructions-for-gearbox.pdf', machineModel: 'Gearbox', tags: ['gearbox', 'installation', 'assembly'] },
    { id: 'sl3015-machine-notes', title: 'SL 3015 Machine Notes', description: 'Updated machine notes and specifications for SL 3015', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/SL_3015_Machine_Notes_Updated.pdf', machineModel: 'SL 3015', tags: ['sl3015', 'machine', 'notes', 'specifications'] },
    // BLT Manuals
    { id: 'blt310-manual', title: 'BLT310 Product Manual', description: 'Complete product manual for BLT310 laser head', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT310-English.pdf', machineModel: 'BLT310', tags: ['blt310', 'laser', 'head', 'manual'] },
    { id: 'blt310-product-manual', title: 'BLT310 Product Manual V1.0', description: 'Detailed product manual for BLT310 laser head system', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT310-Proudct-Manul-V1.0.pdf', machineModel: 'BLT310', tags: ['blt310', 'laser', 'head', 'product'] },
    { id: 'blt310-lens-replacement', title: 'BLT310 Lens Replacement Guide', description: 'Step-by-step guide for replacing collimating and focusing lenses', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT310-CollimatingFocusing-CartridgeLens-Replacement-Guide.pdf', machineModel: 'BLT310', tags: ['blt310', 'lens', 'replacement', 'maintenance'] },
    { id: 'blt421s-manual', title: 'BLT421S Product Manual', description: 'Complete product manual for BLT421S laser head', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT421S-Proudct-Manul-V1.01.pdf', machineModel: 'BLT421S', tags: ['blt421s', 'laser', 'head', 'manual'] },
    // Schematics
    { id: 'blt310-schematic', title: 'BLT310 Schematic Diagram', description: 'Technical schematic diagram of BLT310 laser head', category: 'schematics', fileType: 'image', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT310-Schematic-diagram-of-laser-head.png', machineModel: 'BLT310', tags: ['blt310', 'schematic', 'diagram', 'technical'] },
    { id: 'blt421-schematic', title: 'BLT421S Schematic Diagram', description: 'Technical schematic diagram of BLT421S laser head', category: 'schematics', fileType: 'image', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT421-Schematic-diagram-of-laser-head.png', machineModel: 'BLT421S', tags: ['blt421s', 'schematic', 'diagram', 'technical'] },
    // Videos
    { id: 'blt310-collimated-drawer-video', title: 'BLT310 Collimated Drawer Replacement', description: 'Video tutorial for replacing the collimated drawer on BLT310', category: 'videos', fileType: 'video', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT3X0-Replace-the-collimated-drawer.mp4', machineModel: 'BLT310', tags: ['blt310', 'video', 'tutorial', 'collimated', 'drawer'] },
    { id: 'blt310-collimating-lens-video', title: 'BLT310 Collimating Lens Replacement', description: 'Video tutorial for replacing the collimating lens on BLT310', category: 'videos', fileType: 'video', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT3X0-Replace-the-collimating-lens.mp4', machineModel: 'BLT310', tags: ['blt310', 'video', 'tutorial', 'collimating', 'lens'] },
    { id: 'blt310-focusing-lens-video', title: 'BLT310 Focusing Lens Replacement', description: 'Video tutorial for replacing the focusing lens on BLT310', category: 'videos', fileType: 'video', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT3X0-Replace-the-focusing-lens.mp4', machineModel: 'BLT310', tags: ['blt310', 'video', 'tutorial', 'focusing', 'lens'] },
    { id: 'blt310-focusing-drawer-video', title: 'BLT310 Focusing Drawer Replacement', description: 'Video tutorial for replacing the focusing drawer on BLT310', category: 'videos', fileType: 'video', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT3X0Replace-the-focusing-drawer.mp4', machineModel: 'BLT310', tags: ['blt310', 'video', 'tutorial', 'focusing', 'drawer'] },
    // Troubleshooting
    { id: 'blt-alignment-faq', title: 'BLT Alignment Paper Detection FAQ', description: 'Frequently asked questions about BLT alignment and paper detection', category: 'troubleshooting', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT-Alignment-Paper-Detection-Function-Application-edition-FAQ.pdf', machineModel: 'BLT Series', tags: ['blt', 'alignment', 'paper', 'detection', 'faq'] },
    { id: 'blt-cutting-gas-faq', title: 'BLT Cutting Gas Related Alarms FAQ', description: 'Troubleshooting guide for BLT cutting gas related alarms', category: 'troubleshooting', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT-Cutting-Gas-related-alarms-FAQ.pdf', machineModel: 'BLT Series', tags: ['blt', 'cutting', 'gas', 'alarms', 'faq'] },
    { id: 'blt-lens-temperature-faq', title: 'BLT Lower Protective Lens Temperature Alarm FAQ', description: 'Troubleshooting guide for BLT lens temperature alarms', category: 'troubleshooting', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/BLT-Lower-Protective-Lens-Temperature-alarm-FAQ.pdf', machineModel: 'BLT Series', tags: ['blt', 'lens', 'temperature', 'alarm', 'faq'] },
    { id: 'cutting-quality-troubleshooting', title: 'Cutting Quality Troubleshooting Guide', description: 'Comprehensive guide for troubleshooting poor cutting quality issues', category: 'troubleshooting', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/while-cutting-is-not-good-what-need-to-chec.pdf', machineModel: 'General', tags: ['cutting', 'quality', 'troubleshooting', 'guide'] },
    // Software Manuals
    { id: 'cypcut-e-manual', title: 'CypCut E User Manual 7.0', description: 'Complete user manual for CypCut E software version 7.0', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/CypCutE-User-Manual-7.0-2.pdf', machineModel: 'CypCut E', tags: ['cypcut', 'e', 'software', 'manual', '7.0'] },
    { id: 'fscut4000e-installation', title: 'FSCUT4000E Installation Manual', description: 'Installation manual for FSCUT4000E system', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/FSCUT4000E-Installation-Manual-V1.3.pdf', machineModel: 'FSCUT4000E', tags: ['fscut4000e', 'installation', 'manual'] },
    { id: 'cypnest-manual', title: 'CypNest User Manual', description: 'Complete user manual for CypNest nesting software', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/CypNest-User-Manual_En-1.pdf', machineModel: 'CypNest', tags: ['cypnest', 'nesting', 'software', 'manual'] },
    // Contracts
    { id: 'contract-chinese', title: 'Contract Template (Chinese)', description: 'Contract template in Chinese language', category: 'contracts', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Contract_Chinese.pdf', machineModel: 'General', tags: ['contract', 'chinese', 'template'] },
    { id: 'contract-english', title: 'Contract Template (English)', description: 'Contract template in English language', category: 'contracts', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Contract_English_Hou.pdf', machineModel: 'General', tags: ['contract', 'english', 'template'] },
    // Additional Equipment
    { id: 'hanli-chiller-manual', title: 'HanLi Chiller Manual', description: 'Complete manual for HanLi chiller systems', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/HanLi-Chiller-manual.pdf', machineModel: 'HanLi Chiller', tags: ['hanli', 'chiller', 'manual', 'cooling'] },
    { id: 'transformer-manual', title: 'Transformer Manual', description: 'Complete manual for transformer systems', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Transformer-manual.pdf', machineModel: 'Transformer', tags: ['transformer', 'manual', 'electrical'] },
    { id: 'ac-automatic-manual', title: 'AC Automatic Manual', description: 'Manual for AC automatic systems', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/ac-automatic.pdf', machineModel: 'AC Automatic', tags: ['ac', 'automatic', 'manual', 'electrical'] },
    // SMT Products
    { id: 'ss1510-manual', title: 'SS1510 Compact Fiber Laser Manual', description: 'User manual for SS1510 compact type fiber laser cutting machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/DIY_Fiber_Laser_Install_Guide_Final.pdf', machineModel: 'SS1510', tags: ['ss1510', 'compact', 'fiber', 'laser', 'manual'] },
    { id: 'ss2060-manual', title: 'SS2060 Tube Fiber Laser Manual', description: 'User manual for SS2060 manual loading tube fiber laser cutting machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/DIY_Fiber_Laser_Install_Guide_Final.pdf', machineModel: 'SS2060', tags: ['ss2060', 'tube', 'fiber', 'laser', 'manual'] },
    { id: 'ss2060a-manual', title: 'SS2060A Automatic Tube Fiber Laser Manual', description: 'User manual for SS2060A automatic loading tube fiber laser cutting machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/DIY_Fiber_Laser_Install_Guide_Final.pdf', machineModel: 'SS2060A', tags: ['ss2060a', 'tube', 'fiber', 'laser', 'automatic'] },
    { id: 'ss3015-nighthawk-manual', title: 'SS3015 Nighthawk Open Fiber Laser Manual', description: 'User manual for SS3015 Nighthawk open type fiber laser cutting machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/SL_3015_Machine_Notes_Updated.pdf', machineModel: 'SS3015', tags: ['ss3015', 'nighthawk', 'open', 'fiber', 'laser'] },
    { id: 'ss3015cp-nighthawk-manual', title: 'SS3015CP Nighthawk Enclosed Platform Manual', description: 'User manual for SS3015CP Nighthawk fiber laser with enclosed platform', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/SL_3015_Machine_Notes_Updated.pdf', machineModel: 'SS3015CP', tags: ['ss3015cp', 'nighthawk', 'enclosed', 'platform'] },
    { id: 'sl3015cp-spirit-manual', title: 'SL3015CP Spirit MAX Enclosed Platform Manual', description: 'User manual for SL3015CP Spirit MAX fiber laser with enclosed platform', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/SL_3015_Machine_Notes_Updated.pdf', machineModel: 'SL3015CP', tags: ['sl3015cp', 'spirit', 'max', 'enclosed'] },
    { id: 'ss3015cpr-nighthawk-rotary-manual', title: 'SS3015CPR Nighthawk Rotary Attachment Manual', description: 'User manual for SS3015CPR Nighthawk with platform and rotary attachment', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/SL_3015_Machine_Notes_Updated.pdf', machineModel: 'SS3015CPR', tags: ['ss3015cpr', 'nighthawk', 'rotary', 'attachment'] },
    { id: 'x3-fiber-laser-manual', title: 'X3 Fiber Laser Enclosed Platform Manual', description: 'User manual for X3 fiber laser cutting machine with enclosed platform', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/SL_3015_Machine_Notes_Updated.pdf', machineModel: 'X3', tags: ['x3', 'fiber', 'laser', 'enclosed'] },
    { id: 'slx1390-co2-laser-manual', title: 'SLX1390 CO2 Laser Manual', description: 'User manual for SLX1390 CO2 laser cutting machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/SL_3015_Machine_Notes_Updated.pdf', machineModel: 'SLX1390', tags: ['slx1390', 'co2', 'laser', 'cutting'] },
    { id: 'press-brake-manual', title: 'CNC Press Brake Manual', description: 'User manual for CNC Press Brake machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Installation-instructions-for-gearbox.pdf', machineModel: 'Press Brake', tags: ['press', 'brake', 'cnc', 'bending'] },
    { id: 'fiber-marking-laser-manual', title: 'Fiber Marking Laser Manual', description: 'User manual for fiber laser marking machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/HanLi-Chiller-manual.pdf', machineModel: 'Fiber Marking Laser', tags: ['fiber', 'marking', 'laser', 'engraving'] },
    { id: 'rapid-sander-manual', title: 'SMT Rapid Sander Manual', description: 'User manual for SMT Rapid Sander machine', category: 'manuals', fileType: 'pdf', fileUrl: 'https://stealthlaser.com/wp-content/uploads/2025/10/Installation-instructions-for-gearbox.pdf', machineModel: 'Rapid Sander', tags: ['rapid', 'sander', 'smt', 'finishing'] },
  ];

  for (let i = 0; i < materials.length; i++) {
    const mat = materials[i];
    await prisma.supportMaterial.upsert({
      where: { id: mat.id },
      update: mat,
      create: {
        ...mat,
        fileName: mat.fileUrl.split('/').pop() || 'file',
        isPublished: true,
        sortOrder: i,
        createdBy: adminUser.id,
      },
    });
  }
  console.log(`   ✓ Created ${materials.length} support materials`);

  // ==========================================================================
  // 4. CREATE PRODUCTS (for AI Knowledge)
  // ==========================================================================
  console.log('\n🔧 Creating products catalog...');
  
  const products = [
    { modelCode: 'SS1510', displayName: 'SS1510 Compact Fiber Laser', description: 'Compact type fiber laser cutting machine - perfect for small workshops', category: 'Fiber Laser', keywords: ['compact', 'small', 'entry', 'starter'], features: ['Compact footprint', 'Easy to operate', 'Cost-effective'] },
    { modelCode: 'SS2060', displayName: 'SS2060 Manual Loading Tube Fiber Laser', description: 'Manual loading tube fiber laser cutting machine for tube and pipe cutting', category: 'Tube Laser', keywords: ['tube', 'pipe', 'manual', 'loading'], features: ['Tube cutting', 'Manual loading', 'Versatile'] },
    { modelCode: 'SS2060A', displayName: 'SS2060A Automatic Loading Tube Fiber Laser', description: 'Automatic loading tube fiber laser cutting machine with automated material handling', category: 'Tube Laser', keywords: ['tube', 'pipe', 'automatic', 'loading', 'automated'], features: ['Automatic loading', 'High productivity', 'Reduced labor'] },
    { modelCode: 'SS3015', displayName: 'SS3015 Nighthawk Open Fiber Laser', description: 'Open type fiber laser cutting machine - the Nighthawk series', category: 'Fiber Laser', keywords: ['nighthawk', 'open', 'sheet', 'metal'], features: ['Open design', 'Easy material handling', 'High visibility'] },
    { modelCode: 'SS3015CP', displayName: 'SS3015CP Nighthawk Enclosed Platform', description: 'Fiber laser with enclosed platform for safety and dust collection', category: 'Fiber Laser', keywords: ['nighthawk', 'enclosed', 'platform', 'safety'], features: ['Enclosed platform', 'Improved safety', 'Dust collection'] },
    { modelCode: 'SL3015CP', displayName: 'SL3015CP Spirit MAX Fiber Laser', description: 'MAX power fiber laser with enclosed platform - the Spirit series', category: 'Fiber Laser', keywords: ['spirit', 'max', 'high', 'power', 'enclosed'], features: ['MAX power laser', 'Enclosed platform', 'Professional grade'] },
    { modelCode: 'SS3015CPR', displayName: 'SS3015CPR Nighthawk with Rotary', description: 'Nighthawk with platform and rotary attachment for tube cutting', category: 'Fiber Laser', keywords: ['nighthawk', 'rotary', 'tube', 'sheet'], features: ['Rotary attachment', 'Sheet and tube', 'Versatile'] },
    { modelCode: 'X3', displayName: 'X3 Fiber Laser Enclosed Platform', description: 'Premium fiber laser cutting machine with enclosed platform', category: 'Fiber Laser', keywords: ['x3', 'premium', 'enclosed', 'professional'], features: ['Premium build', 'Full enclosure', 'Advanced features'] },
    { modelCode: 'SLX1390', displayName: 'SLX1390 CO2 Laser', description: 'CO2 laser cutting machine for non-metal materials', category: 'CO2 Laser', keywords: ['co2', 'non-metal', 'wood', 'acrylic', 'fabric'], features: ['CO2 laser source', 'Non-metal cutting', 'Engraving capable'] },
    { modelCode: 'Press Brake', displayName: 'CNC Press Brake', description: 'CNC controlled press brake for precision metal bending', category: 'Press Brake', keywords: ['press', 'brake', 'bending', 'forming', 'cnc'], features: ['CNC controlled', 'Precision bending', 'Multiple tooling'] },
    { modelCode: 'Fiber Marking Laser', displayName: 'Fiber Marking Laser', description: 'Fiber laser marking and engraving machine', category: 'Marking', keywords: ['marking', 'engraving', 'fiber', 'permanent'], features: ['Permanent marking', 'High speed', 'Fine detail'] },
    { modelCode: 'Rapid Sander', displayName: 'SMT Rapid Sander', description: 'Rapid sanding and finishing machine for metal parts', category: 'Finishing', keywords: ['sander', 'finishing', 'deburring', 'polishing'], features: ['Rapid finishing', 'Deburring', 'Surface preparation'] },
  ];

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    await prisma.product.upsert({
      where: { modelCode: prod.modelCode },
      update: prod,
      create: { ...prod, sortOrder: i, isActive: true },
    });
  }
  console.log(`   ✓ Created ${products.length} products`);

  // ==========================================================================
  // 5. CREATE COMPONENTS (for AI Knowledge)
  // ==========================================================================
  console.log('\n🔩 Creating components catalog...');
  
  const components = [
    { name: 'BLT310', displayName: 'BLT310 Laser Head', category: 'Laser Head', manufacturer: 'BLT', keywords: ['laser', 'head', 'cutting', 'blt310'] },
    { name: 'BLT421S', displayName: 'BLT421S Laser Head', category: 'Laser Head', manufacturer: 'BLT', keywords: ['laser', 'head', 'cutting', 'blt421s', 'high', 'power'] },
    { name: 'CypCut E', displayName: 'CypCut E Control Software', category: 'Software', manufacturer: 'Fscut', keywords: ['cypcut', 'control', 'software', 'cnc', 'cutting'] },
    { name: 'CypNest', displayName: 'CypNest Nesting Software', category: 'Software', manufacturer: 'Fscut', keywords: ['cypnest', 'nesting', 'software', 'optimization'] },
    { name: 'AVENTICS 614', displayName: 'AVENTICS 614 Proportional Valve', category: 'Valve', manufacturer: 'AVENTICS', keywords: ['aventics', 'proportional', 'valve', 'gas', 'control'] },
    { name: 'Inovance SV630N', displayName: 'Inovance SV630N Servo Drive', category: 'Servo', manufacturer: 'Inovance', keywords: ['inovance', 'servo', 'drive', 'motor', 'sv630n'] },
    { name: 'Raycus', displayName: 'Raycus Fiber Laser Source', category: 'Laser Source', manufacturer: 'Raycus', keywords: ['raycus', 'fiber', 'laser', 'source', 'generator'] },
    { name: 'HanLi Chiller', displayName: 'HanLi Industrial Chiller', category: 'Cooling', manufacturer: 'HanLi', keywords: ['hanli', 'chiller', 'cooling', 'water', 'temperature'] },
  ];

  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    await prisma.component.upsert({
      where: { name: comp.name },
      update: comp,
      create: { ...comp, sortOrder: i, isActive: true },
    });
  }
  console.log(`   ✓ Created ${components.length} components`);

  // ==========================================================================
  // 6. CREATE MACHINE TYPES
  // ==========================================================================
  console.log('\n🏭 Creating machine types...');
  
  for (const prod of products) {
    await prisma.machineType.upsert({
      where: { modelCode: prod.modelCode },
      update: {
        displayName: prod.displayName,
        description: prod.description,
        category: prod.category,
      },
      create: {
        modelCode: prod.modelCode,
        displayName: prod.displayName,
        description: prod.description,
        category: prod.category,
        isActive: true,
      },
    });
  }
  console.log(`   ✓ Created ${products.length} machine types`);

  // ==========================================================================
  // 7. CREATE AI PROMPTS
  // ==========================================================================
  console.log('\n🤖 Creating AI prompts...');
  
  const prompts = [
    {
      name: 'main_system',
      displayName: 'Main System Prompt',
      description: 'Core personality and technical knowledge - editable in admin',
      prompt: `You are a friendly, knowledgeable support rep for Stealth Machine Tools. You help customers with laser cutting machines, fiber lasers, press brakes, and related equipment. You have access to technical documentation, manuals, videos, and troubleshooting guides.

Your expertise includes:
- Stealth Machine Tools products (fiber lasers, CO2 lasers, press brakes, tube lasers)
- Component systems (BLT laser heads, CypCut E software, AVENTICS valves, Inovance servos)
- Machine troubleshooting, maintenance, installation, and safety

Be conversational and human. Learn their name and use it. Ask what machine they're working with. If they have an issue, ask for their serial number so we can pull up warranty info. Only share materials when directly relevant to their question - no long lists. Be helpful like a knowledgeable friend.`,
      variables: ['materials', 'products', 'components'],
    },
    {
      name: 'greeting',
      displayName: 'Greeting',
      description: 'First message when chat opens - keep it short and inviting',
      prompt: `Hey! I'm here to help with your Stealth Machine Tools equipment. What's going on today - got a question or running into an issue?`,
      variables: [],
    },
    {
      name: 'data_collection',
      displayName: 'Data Collection Instructions',
      description: 'How to collect customer info naturally during the conversation',
      prompt: `During the conversation, naturally collect:
- Customer's name (use it once you know it)
- Which machine/product they're asking about
- Serial number if they're having issues (for warranty/registration)
- Email or phone only if they want follow-up

Ask conversationally, not like a form. Examples:
- "What's your name, by the way?"
- "Which machine are you working with?"
- "Got the serial number handy? I can pull up your warranty info"`,
      variables: [],
    },
    {
      name: 'response_style',
      displayName: 'Response Style',
      description: 'Tone, length, and formatting rules',
      prompt: `- Keep responses SHORT - 2-3 sentences max unless they need detailed steps
- Be warm and human, like a knowledgeable friend
- Ask ONE follow-up question at a time
- Only mention materials when directly relevant to their question
- Use their name after you learn it
- No walls of text or bullet point dumps`,
      variables: [],
    },
    {
      name: 'troubleshooting',
      displayName: 'Troubleshooting Prompt',
      description: 'Prompt for generating troubleshooting guides',
      prompt: `You are a technical troubleshooting expert for industrial CNC machines. Generate a comprehensive troubleshooting guide that includes:
1. Problem identification
2. Possible causes (ranked by likelihood)
3. Step-by-step diagnostic procedures
4. Solution for each cause
5. Prevention measures
6. Safety warnings

Always reference specific materials and documentation when available.`,
      variables: ['machine_model', 'materials'],
    },
    {
      name: 'safety',
      displayName: 'Safety Reminder Prompt',
      description: 'Prompt for generating safety reminders',
      prompt: `You are a safety specialist for industrial CNC machines. Provide clear, concise safety reminders that include:
1. Primary safety concerns
2. Required PPE
3. Hazard warnings
4. Emergency procedures
5. Compliance requirements

Always prioritize operator safety above all else.`,
      variables: [],
    },
  ];

  for (const prompt of prompts) {
    await prisma.aIPrompt.upsert({
      where: { name: prompt.name },
      update: prompt,
      create: { ...prompt, isActive: true, updatedBy: adminUser.id },
    });
  }
  console.log(`   ✓ Created ${prompts.length} AI prompts`);

  // ==========================================================================
  // 8. CREATE AI CONFIG
  // ==========================================================================
  console.log('\n⚙️ Creating AI configuration...');
  
  const configs = [
    { key: 'model', value: 'claude-sonnet-4-5-20250929', type: 'string', description: 'AI model to use for chat' },
    { key: 'max_tokens', value: '4000', type: 'number', description: 'Maximum tokens in response' },
    { key: 'temperature', value: '0.7', type: 'number', description: 'Response creativity (0-1)' },
  ];

  for (const config of configs) {
    await prisma.aIConfig.upsert({
      where: { key: config.key },
      update: config,
      create: { ...config, updatedBy: adminUser.id },
    });
  }
  console.log(`   ✓ Created ${configs.length} AI config items`);

  // ==========================================================================
  // 9. CREATE TICKET CATEGORIES
  // ==========================================================================
  console.log('\n🎫 Creating ticket categories...');
  
  const ticketCategories = [
    { name: 'Technical', displayName: 'Technical Issue', description: 'Machine malfunction or technical problems' },
    { name: 'Installation', displayName: 'Installation Help', description: 'Help with machine installation and setup' },
    { name: 'Maintenance', displayName: 'Maintenance', description: 'Scheduled maintenance and service' },
    { name: 'Training', displayName: 'Training Request', description: 'Training and education requests' },
    { name: 'Parts', displayName: 'Parts & Consumables', description: 'Parts ordering and consumables' },
    { name: 'Warranty', displayName: 'Warranty', description: 'Warranty claims and inquiries' },
    { name: 'Other', displayName: 'Other', description: 'Other inquiries' },
  ];

  for (let i = 0; i < ticketCategories.length; i++) {
    const cat = ticketCategories[i];
    await prisma.ticketCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: { ...cat, sortOrder: i },
    });
  }
  console.log(`   ✓ Created ${ticketCategories.length} ticket categories`);

  // ==========================================================================
  // 10. CREATE APP SETTINGS
  // ==========================================================================
  console.log('\n🔧 Creating app settings...');
  
  const settings = [
    { key: 'app_name', value: 'Stealth Machine Tools', type: 'string', category: 'branding', displayName: 'App Name', isPublic: true },
    { key: 'primary_color', value: '#E31E24', type: 'color', category: 'branding', displayName: 'Primary Color', isPublic: true },
    { key: 'tagline', value: 'AI-Powered Technical Support', type: 'string', category: 'branding', displayName: 'Tagline', isPublic: true },
  ];

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: { ...setting, updatedBy: adminUser.id },
    });
  }
  console.log(`   ✓ Created ${settings.length} app settings`);

  // ==========================================================================
  // DONE
  // ==========================================================================
  console.log('\n✅ Database seeding completed successfully!\n');
  console.log(`📊 Summary:`);
  console.log(`   - 1 admin user`);
  console.log(`   - ${categories.length} material categories`);
  console.log(`   - ${materials.length} support materials`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${components.length} components`);
  console.log(`   - ${prompts.length} AI prompts`);
  console.log(`   - ${configs.length} AI config items`);
  console.log(`   - ${ticketCategories.length} ticket categories`);
  console.log(`   - ${settings.length} app settings`);
  console.log(`\n🔐 Admin login: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
