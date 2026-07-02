const express = require('express');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get knowledge base items
// @route   GET /api/knowledge-base
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Mock data for demonstration
    const knowledgeBaseItems = [
      {
        id: '1',
        title: 'SMT Machine Calibration Guide',
        type: 'manual',
        category: 'calibration',
        description: 'Step-by-step guide for calibrating SMT machines',
        content: 'This guide covers the complete calibration process...',
        tags: ['calibration', 'setup', 'maintenance'],
        machineModels: ['Model A', 'Model B'],
        difficulty: 'intermediate',
        estimatedTime: '30 minutes',
        lastUpdated: new Date(),
        author: 'Technical Team',
      },
      {
        id: '2',
        title: 'Common Error Codes and Solutions',
        type: 'faq',
        category: 'troubleshooting',
        description: 'Frequently asked questions about error codes',
        content: 'Error code E-102 indicates a sensor malfunction...',
        tags: ['error codes', 'troubleshooting', 'sensors'],
        machineModels: ['All Models'],
        difficulty: 'beginner',
        estimatedTime: '10 minutes',
        lastUpdated: new Date(),
        author: 'Support Team',
      },
      {
        id: '3',
        title: 'Safety Procedures for SMT Operations',
        type: 'guide',
        category: 'safety',
        description: 'Important safety guidelines for SMT machine operations',
        content: 'Always follow these safety procedures when operating SMT machines...',
        tags: ['safety', 'procedures', 'operations'],
        machineModels: ['All Models'],
        difficulty: 'beginner',
        estimatedTime: '15 minutes',
        lastUpdated: new Date(),
        author: 'Safety Team',
      },
    ];

    // Filter by category if provided
    let filteredItems = knowledgeBaseItems;
    if (req.query.category) {
      filteredItems = knowledgeBaseItems.filter(item => 
        item.category === req.query.category
      );
    }

    // Filter by type if provided
    if (req.query.type) {
      filteredItems = filteredItems.filter(item => 
        item.type === req.query.type
      );
    }

    // Search by title or content if query provided
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.content.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    res.status(200).json({
      success: true,
      count: filteredItems.length,
      data: filteredItems,
    });
  } catch (error) {
    logger.error('Get knowledge base error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get single knowledge base item
// @route   GET /api/knowledge-base/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Mock data for demonstration
    const knowledgeBaseItem = {
      id: req.params.id,
      title: 'SMT Machine Calibration Guide',
      type: 'manual',
      category: 'calibration',
      description: 'Step-by-step guide for calibrating SMT machines',
      content: `
        <h2>Introduction</h2>
        <p>This guide provides detailed instructions for calibrating SMT machines to ensure optimal performance.</p>
        
        <h2>Prerequisites</h2>
        <ul>
          <li>Machine should be powered off</li>
          <li>All safety equipment should be in place</li>
          <li>Calibration tools should be available</li>
        </ul>
        
        <h2>Step-by-Step Process</h2>
        <ol>
          <li>Power on the machine and wait for initialization</li>
          <li>Access the calibration menu from the main interface</li>
          <li>Follow the on-screen prompts for each calibration step</li>
          <li>Verify calibration results</li>
          <li>Save calibration settings</li>
        </ol>
        
        <h2>Important Notes</h2>
        <p>Always refer to the machine manual for specific calibration procedures for your model.</p>
      `,
      tags: ['calibration', 'setup', 'maintenance'],
      machineModels: ['Model A', 'Model B'],
      difficulty: 'intermediate',
      estimatedTime: '30 minutes',
      lastUpdated: new Date(),
      author: 'Technical Team',
      attachments: [
        {
          name: 'calibration-checklist.pdf',
          url: '/attachments/calibration-checklist.pdf',
          type: 'application/pdf',
          size: 1024000,
        },
        {
          name: 'calibration-video.mp4',
          url: '/attachments/calibration-video.mp4',
          type: 'video/mp4',
          size: 25600000,
        },
      ],
      relatedItems: [
        {
          id: '2',
          title: 'Common Error Codes and Solutions',
          type: 'faq',
        },
        {
          id: '3',
          title: 'Safety Procedures for SMT Operations',
          type: 'guide',
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: knowledgeBaseItem,
    });
  } catch (error) {
    logger.error('Get knowledge base item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Search knowledge base
// @route   GET /api/knowledge-base/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q: query, category, type, difficulty } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    // Mock search results
    const searchResults = [
      {
        id: '1',
        title: 'SMT Machine Calibration Guide',
        type: 'manual',
        category: 'calibration',
        description: 'Step-by-step guide for calibrating SMT machines',
        relevanceScore: 0.95,
        matchedTerms: ['calibration', 'SMT', 'machine'],
      },
      {
        id: '2',
        title: 'Common Error Codes and Solutions',
        type: 'faq',
        category: 'troubleshooting',
        description: 'Frequently asked questions about error codes',
        relevanceScore: 0.87,
        matchedTerms: ['error', 'codes', 'solutions'],
      },
    ];

    res.status(200).json({
      success: true,
      query,
      count: searchResults.length,
      data: searchResults,
    });
  } catch (error) {
    logger.error('Search knowledge base error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get knowledge base categories
// @route   GET /api/knowledge-base/categories
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = [
      {
        id: 'calibration',
        name: 'Calibration',
        description: 'Machine calibration guides and procedures',
        itemCount: 15,
      },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Common issues and solutions',
        itemCount: 25,
      },
      {
        id: 'safety',
        name: 'Safety',
        description: 'Safety procedures and guidelines',
        itemCount: 10,
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        description: 'Preventive and corrective maintenance',
        itemCount: 20,
      },
      {
        id: 'installation',
        name: 'Installation',
        description: 'Installation guides and setup procedures',
        itemCount: 12,
      },
      {
        id: 'training',
        name: 'Training',
        description: 'Training materials and courses',
        itemCount: 8,
      },
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Get knowledge base categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

module.exports = router;
