const express = require('express');
const { body, validationResult } = require('express-validator');
const documentService = require('../services/documentService');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Search documents
// @route   POST /api/documents/search
// @access  Private
router.post('/search', protect, [
  body('query').trim().isLength({ min: 1 }).withMessage('Search query is required'),
  body('type').optional().isIn(['pdf', 'image', 'docx', 'txt', 'video', 'executable', 'xml', 'all']).withMessage('Invalid document type'),
  body('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { query, type = 'all', limit = 10 } = req.body;
    const user = req.user;

    // Search documents
    const results = await documentService.searchDocuments(query, {
      limit,
      type,
      includeContent: true
    });

    logger.info(`Document search: User ${user.email}, Query: ${query}, Results: ${results.length}`);

    res.status(200).json({
      success: true,
      data: {
        query,
        results,
        total: results.length,
        type,
      },
    });
  } catch (error) {
    logger.error('Document search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Document search failed',
    });
  }
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get document
    const document = await documentService.getDocument(id);
    const thumbnail = await documentService.getDocumentThumbnail(id);

    logger.info(`Document retrieved: User ${user.email}, Document: ${document.title}`);

    res.status(200).json({
      success: true,
      data: {
        document,
        thumbnail,
      },
    });
  } catch (error) {
    logger.error('Document retrieval error:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Document not found',
    });
  }
});

// @desc    Get all PDF documents
// @route   GET /api/documents/pdf
// @access  Private
router.get('/pdf', protect, async (req, res) => {
  try {
    const user = req.user;
    const documents = await documentService.getDocumentsByType('pdf');

    logger.info(`PDF documents retrieved: User ${user.email}, Count: ${documents.length}`);

    res.status(200).json({
      success: true,
      data: {
        documents,
        total: documents.length,
        type: 'pdf',
      },
    });
  } catch (error) {
    logger.error('PDF documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve PDF documents',
    });
  }
});

// @desc    Get all image documents
// @route   GET /api/documents/images
// @access  Private
router.get('/images', protect, async (req, res) => {
  try {
    const user = req.user;
    const documents = await documentService.getDocumentsByType('image');

    logger.info(`Image documents retrieved: User ${user.email}, Count: ${documents.length}`);

    res.status(200).json({
      success: true,
      data: {
        documents,
        total: documents.length,
        type: 'image',
      },
    });
  } catch (error) {
    logger.error('Image documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve image documents',
    });
  }
});

// @desc    Get all DOCX documents
// @route   GET /api/documents/docx
// @access  Private
router.get('/docx', protect, async (req, res) => {
  try {
    const user = req.user;
    const documents = await documentService.getDocumentsByType('docx');

    logger.info(`DOCX documents retrieved: User ${user.email}, Count: ${documents.length}`);

    res.status(200).json({
      success: true,
      data: {
        documents,
        total: documents.length,
        type: 'docx',
      },
    });
  } catch (error) {
    logger.error('DOCX documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve DOCX documents',
    });
  }
});

// @desc    Get all TXT documents
// @route   GET /api/documents/txt
// @access  Private
router.get('/txt', protect, async (req, res) => {
  try {
    const user = req.user;
    const documents = await documentService.getDocumentsByType('txt');

    logger.info(`TXT documents retrieved: User ${user.email}, Count: ${documents.length}`);

    res.status(200).json({
      success: true,
      data: {
        documents,
        total: documents.length,
        type: 'txt',
      },
    });
  } catch (error) {
    logger.error('TXT documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve TXT documents',
    });
  }
});

// @desc    Get all video documents
// @route   GET /api/documents/videos
// @access  Private
router.get('/videos', protect, async (req, res) => {
  try {
    const user = req.user;
    const documents = await documentService.getDocumentsByType('video');

    logger.info(`Video documents retrieved: User ${user.email}, Count: ${documents.length}`);

    res.status(200).json({
      success: true,
      data: {
        documents,
        total: documents.length,
        type: 'video',
      },
    });
  } catch (error) {
    logger.error('Video documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve video documents',
    });
  }
});

// @desc    Get all executable documents
// @route   GET /api/documents/executables
// @access  Private
router.get('/executables', protect, async (req, res) => {
  try {
    const user = req.user;
    const documents = await documentService.getDocumentsByType('executable');

    logger.info(`Executable documents retrieved: User ${user.email}, Count: ${documents.length}`);

    res.status(200).json({
      success: true,
      data: {
        documents,
        total: documents.length,
        type: 'executable',
      },
    });
  } catch (error) {
    logger.error('Executable documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve executable documents',
    });
  }
});

// @desc    Get all XML documents
// @route   GET /api/documents/xml
// @access  Private
router.get('/xml', protect, async (req, res) => {
  try {
    const user = req.user;
    const documents = await documentService.getXMLDocuments();

    logger.info(`XML documents retrieved: User ${user.email}, Count: ${documents.length}`);

    res.status(200).json({
      success: true,
      data: {
        documents,
        total: documents.length,
        type: 'xml',
      },
    });
  } catch (error) {
    logger.error('XML documents retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve XML documents',
    });
  }
});

// @desc    Get document index statistics
// @route   GET /api/documents/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = req.user;
    const stats = documentService.getIndexStats();

    logger.info(`Document stats retrieved: User ${user.email}`);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Document stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve document statistics',
    });
  }
});

// @desc    Refresh document index
// @route   POST /api/documents/refresh
// @access  Private (Admin only)
router.post('/refresh', protect, async (req, res) => {
  try {
    const user = req.user;

    // Check if user is admin
    if (user.role !== 'systemAdmin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
      });
    }

    // Refresh document index
    await documentService.refreshIndex();
    const stats = documentService.getIndexStats();

    logger.info(`Document index refreshed: User ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Document index refreshed successfully',
      data: stats,
    });
  } catch (error) {
    logger.error('Document index refresh error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh document index',
    });
  }
});

// @desc    Get document thumbnail
// @route   GET /api/documents/:id/thumbnail
// @access  Private
router.get('/:id/thumbnail', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get document thumbnail
    const thumbnail = await documentService.getDocumentThumbnail(id);

    if (!thumbnail) {
      return res.status(404).json({
        success: false,
        error: 'Thumbnail not found',
      });
    }

    logger.info(`Document thumbnail retrieved: User ${user.email}, Document: ${id}`);

    res.status(200).json({
      success: true,
      data: {
        thumbnail,
        documentId: id,
      },
    });
  } catch (error) {
    logger.error('Document thumbnail error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve document thumbnail',
    });
  }
});

module.exports = router;
