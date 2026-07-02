const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const pdf2pic = require('pdf2pic');
const sharp = require('sharp');
const glob = require('glob');
const logger = require('../utils/logger');

class DocumentService {
  constructor() {
    this.documentsPath = path.join(__dirname, '../../REFERENCE DOCUMENTS');
    this.indexedDocuments = new Map();
    this.imageCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize document service and index all documents
   */
  async initialize() {
    try {
      logger.info('Initializing document service...');
      
      // Check if documents directory exists
      if (!await fs.pathExists(this.documentsPath)) {
        logger.warn('Reference documents directory not found, creating...');
        await fs.ensureDir(this.documentsPath);
      }

      // Index all documents
      await this.indexDocuments();
      
      this.isInitialized = true;
      logger.info(`Document service initialized with ${this.indexedDocuments.size} documents`);
    } catch (error) {
      logger.error('Failed to initialize document service:', error);
      throw error;
    }
  }

  /**
   * Index all documents in the reference documents folder
   */
  async indexDocuments() {
    try {
      // Find all PDF files recursively
      const pdfFiles = glob.sync('**/*.pdf', { 
        cwd: this.documentsPath,
        absolute: true 
      });

      // Find all image files
      const imageFiles = glob.sync('**/*.{png,jpg,jpeg,gif,svg}', { 
        cwd: this.documentsPath,
        absolute: true 
      });

      // Find all document files
      const docxFiles = glob.sync('**/*.docx', { 
        cwd: this.documentsPath,
        absolute: true 
      });

      // Find all text files
      const txtFiles = glob.sync('**/*.txt', { 
        cwd: this.documentsPath,
        absolute: true 
      });

      // Find all video files
      const videoFiles = glob.sync('**/*.{mp4,avi,mov,wmv,flv}', { 
        cwd: this.documentsPath,
        absolute: true 
      });

      // Find all executable files
      const exeFiles = glob.sync('**/*.exe', { 
        cwd: this.documentsPath,
        absolute: true 
      });

      // Find all XML files
      const xmlFiles = glob.sync('**/*.xml', { 
        cwd: this.documentsPath,
        absolute: true 
      });

      // Process PDF files
      for (const pdfPath of pdfFiles) {
        await this.indexPDFDocument(pdfPath);
      }

      // Process image files
      for (const imagePath of imageFiles) {
        await this.indexImageDocument(imagePath);
      }

      // Process DOCX files
      for (const docxPath of docxFiles) {
        await this.indexDOCXDocument(docxPath);
      }

      // Process text files
      for (const txtPath of txtFiles) {
        await this.indexTextDocument(txtPath);
      }

      // Process video files
      for (const videoPath of videoFiles) {
        await this.indexVideoDocument(videoPath);
      }

      // Process executable files
      for (const exePath of exeFiles) {
        await this.indexExecutableDocument(exePath);
      }

      // Process XML files
      for (const xmlPath of xmlFiles) {
        await this.indexXMLDocument(xmlPath);
      }

      logger.info(`Indexed ${pdfFiles.length} PDF, ${imageFiles.length} images, ${docxFiles.length} DOCX, ${txtFiles.length} TXT, ${videoFiles.length} videos, ${exeFiles.length} executables, ${xmlFiles.length} XML files`);
    } catch (error) {
      logger.error('Error indexing documents:', error);
      throw error;
    }
  }

  /**
   * Index a single PDF document
   */
  async indexPDFDocument(pdfPath) {
    try {
      const relativePath = path.relative(this.documentsPath, pdfPath);
      const fileName = path.basename(pdfPath, '.pdf');
      
      // Parse PDF text content
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdf(pdfBuffer);
      
      // Extract images from PDF (first 5 pages for performance)
      const images = await this.extractImagesFromPDF(pdfPath);
      
      const document = {
        id: this.generateDocumentId(relativePath),
        type: 'pdf',
        title: fileName,
        path: relativePath,
        fullPath: pdfPath,
        content: pdfData.text,
        pages: pdfData.numpages,
        images: images,
        size: pdfData.info?.FileSize || 0,
        createdAt: new Date(),
        lastModified: (await fs.stat(pdfPath)).mtime,
        tags: this.extractTags(fileName, pdfData.text),
        summary: this.generateSummary(pdfData.text, fileName)
      };

      this.indexedDocuments.set(document.id, document);
      
      // Cache first image as thumbnail
      if (images.length > 0) {
        this.imageCache.set(document.id, images[0]);
      }

      logger.debug(`Indexed PDF: ${fileName}`);
    } catch (error) {
      logger.error(`Error indexing PDF ${pdfPath}:`, error);
    }
  }

  /**
   * Index a single image document
   */
  async indexImageDocument(imagePath) {
    try {
      const relativePath = path.relative(this.documentsPath, imagePath);
      const fileName = path.basename(imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      
      const document = {
        id: this.generateDocumentId(relativePath),
        type: 'image',
        title: fileName,
        path: relativePath,
        fullPath: imagePath,
        content: '', // Images don't have text content
        format: ext.substring(1),
        size: (await fs.stat(imagePath)).size,
        createdAt: new Date(),
        lastModified: (await fs.stat(imagePath)).mtime,
        tags: this.extractTags(fileName, ''),
        summary: `Image file: ${fileName}`
      };

      this.indexedDocuments.set(document.id, document);
      
      // Cache image as thumbnail
      const thumbnail = await this.generateThumbnail(imagePath);
      this.imageCache.set(document.id, thumbnail);

      logger.debug(`Indexed image: ${fileName}`);
    } catch (error) {
      logger.error(`Error indexing image ${imagePath}:`, error);
    }
  }

  /**
   * Index a single DOCX document
   */
  async indexDOCXDocument(docxPath) {
    try {
      const relativePath = path.relative(this.documentsPath, docxPath);
      const fileName = path.basename(docxPath);
      
      // Read DOCX content (basic text extraction)
      const docxContent = await fs.readFile(docxPath);
      
      const document = {
        id: this.generateDocumentId(relativePath),
        type: 'docx',
        title: fileName,
        path: relativePath,
        fullPath: docxPath,
        content: 'Word document - content extraction requires specialized library',
        format: 'docx',
        size: (await fs.stat(docxPath)).size,
        createdAt: new Date(),
        lastModified: (await fs.stat(docxPath)).mtime,
        tags: this.extractTags(fileName, ''),
        summary: `Word document: ${fileName}`
      };

      this.indexedDocuments.set(document.id, document);
      
      logger.debug(`Indexed DOCX: ${fileName}`);
    } catch (error) {
      logger.error(`Error indexing DOCX ${docxPath}:`, error);
    }
  }

  /**
   * Index a single text document
   */
  async indexTextDocument(txtPath) {
    try {
      const relativePath = path.relative(this.documentsPath, txtPath);
      const fileName = path.basename(txtPath);
      
      // Read text content
      const textContent = await fs.readFile(txtPath, 'utf8');
      
      const document = {
        id: this.generateDocumentId(relativePath),
        type: 'txt',
        title: fileName,
        path: relativePath,
        fullPath: txtPath,
        content: textContent,
        format: 'txt',
        size: (await fs.stat(txtPath)).size,
        createdAt: new Date(),
        lastModified: (await fs.stat(txtPath)).mtime,
        tags: this.extractTags(fileName, textContent),
        summary: this.generateSummary(textContent, fileName)
      };

      this.indexedDocuments.set(document.id, document);
      
      logger.debug(`Indexed TXT: ${fileName}`);
    } catch (error) {
      logger.error(`Error indexing TXT ${txtPath}:`, error);
    }
  }

  /**
   * Index a single video document
   */
  async indexVideoDocument(videoPath) {
    try {
      const relativePath = path.relative(this.documentsPath, videoPath);
      const fileName = path.basename(videoPath);
      const ext = path.extname(videoPath).toLowerCase();
      
      const document = {
        id: this.generateDocumentId(relativePath),
        type: 'video',
        title: fileName,
        path: relativePath,
        fullPath: videoPath,
        content: `Video file: ${fileName}`,
        format: ext.substring(1),
        size: (await fs.stat(videoPath)).size,
        createdAt: new Date(),
        lastModified: (await fs.stat(videoPath)).mtime,
        tags: this.extractTags(fileName, ''),
        summary: `Training video: ${fileName}`
      };

      this.indexedDocuments.set(document.id, document);
      
      logger.debug(`Indexed video: ${fileName}`);
    } catch (error) {
      logger.error(`Error indexing video ${videoPath}:`, error);
    }
  }

  /**
   * Index a single executable document
   */
  async indexExecutableDocument(exePath) {
    try {
      const relativePath = path.relative(this.documentsPath, exePath);
      const fileName = path.basename(exePath);
      
      const document = {
        id: this.generateDocumentId(relativePath),
        type: 'executable',
        title: fileName,
        path: relativePath,
        fullPath: exePath,
        content: `Software installation file: ${fileName}`,
        format: 'exe',
        size: (await fs.stat(exePath)).size,
        createdAt: new Date(),
        lastModified: (await fs.stat(exePath)).mtime,
        tags: this.extractTags(fileName, ''),
        summary: `Software installer: ${fileName}`
      };

      this.indexedDocuments.set(document.id, document);
      
      logger.debug(`Indexed executable: ${fileName}`);
    } catch (error) {
      logger.error(`Error indexing executable ${exePath}:`, error);
    }
  }

  /**
   * Index a single XML document
   */
  async indexXMLDocument(xmlPath) {
    try {
      const relativePath = path.relative(this.documentsPath, xmlPath);
      const fileName = path.basename(xmlPath);
      
      // Read XML content
      const xmlContent = await fs.readFile(xmlPath, 'utf8');
      
      // Extract text content from XML (basic parsing)
      const textContent = this.extractXMLText(xmlContent);
      
      const document = {
        id: this.generateDocumentId(relativePath),
        type: 'xml',
        title: fileName,
        path: relativePath,
        fullPath: xmlPath,
        content: textContent,
        rawXml: xmlContent,
        format: 'xml',
        size: (await fs.stat(xmlPath)).size,
        createdAt: new Date(),
        lastModified: (await fs.stat(xmlPath)).mtime,
        tags: this.extractTags(fileName, textContent),
        summary: this.generateSummary(textContent, fileName)
      };

      this.indexedDocuments.set(document.id, document);
      
      logger.debug(`Indexed XML: ${fileName}`);
    } catch (error) {
      logger.error(`Error indexing XML ${xmlPath}:`, error);
    }
  }

  /**
   * Extract images from PDF pages
   */
  async extractImagesFromPDF(pdfPath, maxPages = 5) {
    try {
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 150, // Lower density for faster processing
        saveFilename: "page",
        savePath: "./temp/images",
        format: "png",
        width: 800,
        height: 600
      });

      const images = [];
      const pageCount = Math.min(maxPages, 5); // Limit to first 5 pages

      for (let i = 1; i <= pageCount; i++) {
        try {
          const result = await convert(i, { responseType: "base64" });
          if (result.base64) {
            images.push({
              page: i,
              base64: result.base64,
              url: `data:image/png;base64,${result.base64}`
            });
          }
        } catch (pageError) {
          logger.warn(`Error extracting page ${i} from PDF:`, pageError.message);
        }
      }

      return images;
    } catch (error) {
      logger.error('Error extracting images from PDF:', error);
      return [];
    }
  }

  /**
   * Generate thumbnail for image files
   */
  async generateThumbnail(imagePath) {
    try {
      const buffer = await fs.readFile(imagePath);
      const thumbnail = await sharp(buffer)
        .resize(200, 200, { fit: 'inside' })
        .png()
        .toBuffer();
      
      return {
        base64: thumbnail.toString('base64'),
        url: `data:image/png;base64,${thumbnail.toString('base64')}`
      };
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Search documents based on query
   */
  async searchDocuments(query, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      limit = 10,
      type = 'all', // 'pdf', 'image', 'xml', or 'all'
      includeContent = true
    } = options;

    const results = [];
    const searchTerms = query.toLowerCase().split(/\s+/);

    for (const [id, doc] of this.indexedDocuments) {
      if (type !== 'all' && doc.type !== type) continue;

      let score = 0;
      const title = doc.title.toLowerCase();
      const content = doc.content.toLowerCase();
      const tags = doc.tags.join(' ').toLowerCase();

      // Calculate relevance score
      for (const term of searchTerms) {
        if (title.includes(term)) score += 10;
        if (tags.includes(term)) score += 5;
        if (content.includes(term)) score += 1;
      }

      if (score > 0) {
        results.push({
          ...doc,
          relevanceScore: score,
          content: includeContent ? doc.content.substring(0, 500) : undefined
        });
      }
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get document by ID
   */
  async getDocument(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const document = this.indexedDocuments.get(id);
    if (!document) {
      throw new Error(`Document with ID ${id} not found`);
    }

    return document;
  }

  /**
   * Get document thumbnail
   */
  async getDocumentThumbnail(id) {
    return this.imageCache.get(id) || null;
  }

  /**
   * Get all documents by type
   */
  async getDocumentsByType(type) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const documents = [];
    for (const [id, doc] of this.indexedDocuments) {
      if (doc.type === type) {
        documents.push(doc);
      }
    }

    return documents.sort((a, b) => b.lastModified - a.lastModified);
  }

  /**
   * Get all XML documents
   */
  async getXMLDocuments() {
    return this.getDocumentsByType('xml');
  }

  /**
   * Get context for AI based on user query
   */
  async getAIContext(query, maxDocuments = 5) {
    const searchResults = await this.searchDocuments(query, {
      limit: maxDocuments,
      includeContent: true
    });

    const context = {
      relevantDocuments: searchResults.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        summary: doc.summary,
        content: doc.content,
        images: doc.images || [],
        path: doc.path,
        relevanceScore: doc.relevanceScore
      })),
      totalDocuments: this.indexedDocuments.size,
      searchQuery: query
    };

    return context;
  }

  /**
   * Generate unique document ID
   */
  generateDocumentId(relativePath) {
    return relativePath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * Extract tags from filename and content
   */
  extractTags(fileName, content) {
    const tags = new Set();
    
    // Extract from filename
    const nameTags = fileName.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(tag => tag.length > 2);
    
    nameTags.forEach(tag => tags.add(tag));

    // Extract common technical terms from content
    const technicalTerms = [
      'laser', 'cutting', 'head', 'lens', 'alignment', 'calibration',
      'installation', 'maintenance', 'troubleshooting', 'manual', 'guide',
      'schematic', 'diagram', 'specification', 'sensor', 'valve', 'pressure',
      'chiller', 'servo', 'drive', 'transformer', 'voltage', 'current'
    ];

    const contentLower = content.toLowerCase();
    technicalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        tags.add(term);
      }
    });

    return Array.from(tags);
  }

  /**
   * Extract text content from XML
   */
  extractXMLText(xmlContent) {
    try {
      // Remove XML tags and extract text content
      let text = xmlContent
        .replace(/<[^>]*>/g, ' ') // Remove XML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Remove CDATA sections and extract content
      text = text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
      
      return text;
    } catch (error) {
      logger.error('Error extracting XML text:', error);
      return xmlContent; // Return raw content if parsing fails
    }
  }

  /**
   * Generate document summary
   */
  generateSummary(content, fileName) {
    if (!content || content.length < 50) {
      return `Document: ${fileName}`;
    }

    // Extract first few sentences as summary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 3).join('. ').trim();
    
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
  }

  /**
   * Refresh document index
   */
  async refreshIndex() {
    logger.info('Refreshing document index...');
    this.indexedDocuments.clear();
    this.imageCache.clear();
    await this.indexDocuments();
    logger.info('Document index refreshed');
  }

  /**
   * Get index statistics
   */
  getIndexStats() {
    const stats = {
      totalDocuments: this.indexedDocuments.size,
      pdfCount: 0,
      imageCount: 0,
      docxCount: 0,
      txtCount: 0,
      videoCount: 0,
      executableCount: 0,
      xmlCount: 0,
      totalSize: 0
    };

    for (const doc of this.indexedDocuments.values()) {
      switch (doc.type) {
        case 'pdf': stats.pdfCount++; break;
        case 'image': stats.imageCount++; break;
        case 'docx': stats.docxCount++; break;
        case 'txt': stats.txtCount++; break;
        case 'video': stats.videoCount++; break;
        case 'executable': stats.executableCount++; break;
        case 'xml': stats.xmlCount++; break;
      }
      stats.totalSize += doc.size || 0;
    }

    return stats;
  }
}

module.exports = new DocumentService();
