/**
 * Upload Vercel Blob Backup Files to Vercel Blob Storage
 * 
 * This script uploads all files from the backup folder to Vercel Blob
 * and updates the database with the new blob URLs if needed.
 * 
 * Usage:
 *   node scripts/upload-blobs-to-vercel.js
 * 
 * Environment Variables Required:
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob read/write token
 */

// CommonJS version for Node.js
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// Load token from .env.local file and set as environment variable
function loadEnvToken() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^BLOB_READ_WRITE_TOKEN="?(.+?)"?$/m);
    if (match && match[1]) {
      const token = match[1].trim();
      // Set as environment variable so @vercel/blob can read it
      process.env.BLOB_READ_WRITE_TOKEN = token;
      return token;
    }
  }
  return process.env.BLOB_READ_WRITE_TOKEN;
}

const VERCEL_BLOB_TOKEN = loadEnvToken();

if (!VERCEL_BLOB_TOKEN || VERCEL_BLOB_TOKEN.length < 20) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN is missing or invalid');
  console.error('   Current token length:', VERCEL_BLOB_TOKEN ? VERCEL_BLOB_TOKEN.length : 0);
  console.error('   Get your token from: https://vercel.com/dashboard/stores');
  console.error('   Make sure the full token is in .env.local file as:');
  console.error('   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_...your-full-token-here..."');
  process.exit(1);
}

console.log(`✅ Token loaded (length: ${VERCEL_BLOB_TOKEN.length}, starts with: ${VERCEL_BLOB_TOKEN.substring(0, 20)}...)`);

async function uploadFile(filePath, blobPath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Skip .meta.json files - we'll use them for reference but don't upload them
    if (fileName.endsWith('.meta.json')) {
      return null;
    }

    console.log(`📤 Uploading: ${blobPath}...`);
    
    const { url, pathname } = await put(blobPath, fileBuffer, {
      access: 'public',
    });

    console.log(`✅ Uploaded: ${url}`);
    return {
      originalPath: blobPath,
      url: url,
      pathname: pathname,
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${blobPath}:`, error.message);
    return null;
  }
}

async function uploadAllFiles() {
  const results = {
    videos: [],
    photos: [],
    errors: [],
  };

  // Upload videos
  const videosFolder = path.join(__dirname, '../..', 'vercel blob backup', 'blobs', 'videos');
  if (fs.existsSync(videosFolder)) {
    console.log('\n🎥 Uploading videos...\n');
    const videoFiles = fs.readdirSync(videosFolder);
    
    for (const file of videoFiles) {
      const filePath = path.join(videosFolder, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && !file.endsWith('.meta.json')) {
        const blobPath = `videos/${file}`;
        const result = await uploadFile(filePath, blobPath);
        if (result) {
          results.videos.push(result);
        } else {
          results.errors.push(`Failed: ${blobPath}`);
        }
      }
    }
  }

  // Upload photos
  const photosFolder = path.join(__dirname, '../..', 'vercel blob backup', 'blobs', 'photos');
  if (fs.existsSync(photosFolder)) {
    console.log('\n📸 Uploading photos...\n');
    const photoFiles = fs.readdirSync(photosFolder);
    
    for (const file of photoFiles) {
      const filePath = path.join(photosFolder, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && !file.endsWith('.meta.json')) {
        const blobPath = `photos/${file}`;
        const result = await uploadFile(filePath, blobPath);
        if (result) {
          results.photos.push(result);
        } else {
          results.errors.push(`Failed: ${blobPath}`);
        }
      }
    }
  }

  // Save upload results
  const resultsPath = path.join(__dirname, '../..', 'blob-upload-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('\n📊 Upload Summary:');
  console.log(`   ✅ Videos: ${results.videos.length}`);
  console.log(`   ✅ Photos: ${results.photos.length}`);
  console.log(`   ❌ Errors: ${results.errors.length}`);
  console.log(`\n📄 Results saved to: ${resultsPath}`);
  
  return results;
}

// Run upload
uploadAllFiles()
  .then(() => {
    console.log('\n✨ Upload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  });

