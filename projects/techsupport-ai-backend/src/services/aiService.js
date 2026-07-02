const Anthropic = require('@anthropic-ai/sdk');
const documentService = require('./documentService');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 4000;
    this.temperature = parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7;
    this.confidenceThreshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.8;
    this.escalationThreshold = parseFloat(process.env.AI_ESCALATION_THRESHOLD) || 0.6;
  }

  /**
   * Generate AI response based on user input and context
   * @param {string} userInput - User's question or message
   * @param {Object} user - User object with role and preferences
   * @param {Object} context - Additional context (tickets, machines, etc.)
   * @returns {Object} AI response with confidence and suggested actions
   */
  async generateResponse(userInput, user, context = {}) {
    try {
      // Get relevant documents for the user query
      const documentContext = await documentService.getAIContext(userInput, 5);
      
      // Build enhanced system prompt with document context
      const systemPrompt = this.buildSystemPrompt(user, { ...context, documents: documentContext });
      
      // Prepare messages for Claude
      const messages = [
        {
          role: 'user',
          content: this.buildClaudeMessage(userInput, documentContext)
        }
      ];

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: messages,
      });

      const aiResponse = response.content[0].text;
      const confidence = this.calculateConfidence(response);
      const suggestedActions = this.extractSuggestedActions(aiResponse);
      const shouldEscalate = this.shouldEscalate(confidence, userInput, aiResponse);

      logger.info(`Claude response generated for user ${user.email} with confidence: ${confidence}`);

      return {
        response: aiResponse,
        confidence,
        suggestedActions,
        shouldEscalate,
        model: this.model,
        tokens: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        timestamp: new Date(),
        relevantDocuments: documentContext.relevantDocuments,
      };
    } catch (error) {
      logger.error('AI service error:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Build system prompt based on user role and context
   * @param {Object} user - User object
   * @param {Object} context - Additional context
   * @returns {string} System prompt
   */
  buildSystemPrompt(user, context) {
    const basePrompt = `You are an AI assistant for a tech support portal specializing in SMT (Surface Mount Technology) machines and fiber laser cutting systems. 
    You help customers, sales agents, technicians, and support managers with technical issues, installations, maintenance, and training.

    Your capabilities include:
    - Troubleshooting SMT machine and fiber laser issues
    - Providing installation and setup guidance
    - Maintenance recommendations and procedures
    - Training and educational content
    - Product information and specifications
    - Safety guidelines and best practices
    - Analyzing technical diagrams and schematics
    - Interpreting PDF manuals and documentation

    IMPORTANT: You have access to a comprehensive database of technical documents including:
    - Installation guides and manuals
    - Technical schematics and diagrams
    - Troubleshooting procedures
    - Component specifications
    - Safety protocols

    Always prioritize safety and refer to the specific documentation provided when giving technical guidance.`;

    const roleSpecificPrompt = this.getRoleSpecificPrompt(user.role);
    const contextPrompt = this.getContextPrompt(context);
    const documentPrompt = this.getDocumentPrompt(context.documents);

    return `${basePrompt}\n\n${roleSpecificPrompt}\n\n${contextPrompt}\n\n${documentPrompt}`;
  }

  /**
   * Build Claude-specific message with document context
   */
  buildClaudeMessage(userInput, documentContext) {
    let message = `User Question: ${userInput}\n\n`;

    if (documentContext.relevantDocuments && documentContext.relevantDocuments.length > 0) {
      message += `Relevant Technical Documents Found:\n`;
      documentContext.relevantDocuments.forEach((doc, index) => {
        message += `\n${index + 1}. ${doc.title} (${doc.type.toUpperCase()})\n`;
        message += `   Path: ${doc.path}\n`;
        message += `   Summary: ${doc.summary}\n`;
        if (doc.content && doc.content.length > 0) {
          message += `   Key Content: ${doc.content.substring(0, 500)}...\n`;
        }
        if (doc.images && doc.images.length > 0) {
          message += `   Contains ${doc.images.length} technical diagram(s)/image(s)\n`;
        }
      });
      message += `\nPlease reference these documents when providing your answer and mention specific document names when relevant.\n`;
    }

    return message;
  }

  /**
   * Build document-specific prompt
   */
  getDocumentPrompt(documents) {
    if (!documents || !documents.relevantDocuments || documents.relevantDocuments.length === 0) {
      return '';
    }

    let prompt = `Available Technical Documentation:\n`;
    documents.relevantDocuments.forEach((doc, index) => {
      prompt += `${index + 1}. ${doc.title} - ${doc.summary}\n`;
    });

    prompt += `\nWhen answering technical questions, reference specific documents and page numbers when available. 
    If the user asks about procedures, installations, or troubleshooting, direct them to the relevant manual sections.`;

    return prompt;
  }

  /**
   * Get role-specific prompt instructions
   * @param {string} role - User role
   * @returns {string} Role-specific instructions
   */
  getRoleSpecificPrompt(role) {
    const rolePrompts = {
      customer: `You are assisting a customer. Focus on:
      - Clear, non-technical explanations
      - Step-by-step troubleshooting guides
      - When to contact support
      - Basic maintenance tasks they can perform
      - Safety warnings and precautions`,

      salesAgent: `You are assisting a sales agent. Focus on:
      - Product specifications and features
      - Competitive advantages
      - Customer use cases and benefits
      - Pricing and configuration guidance
      - Technical support escalation procedures`,

      technician: `You are assisting a field technician. Focus on:
      - Advanced troubleshooting procedures
      - Technical specifications and schematics
      - Repair and maintenance procedures
      - Parts identification and ordering
      - Safety protocols and procedures
      - Documentation and reporting requirements`,

      supportManager: `You are assisting a support manager. Focus on:
      - Team management and coordination
      - Escalation procedures
      - Performance metrics and analytics
      - Customer satisfaction strategies
      - Process improvements
      - Resource allocation`,

      systemAdmin: `You are assisting a system administrator. Focus on:
      - System configuration and management
      - User management and permissions
      - Analytics and reporting
      - AI training and optimization
      - System maintenance and updates
      - Security and compliance`,

      default: `You are providing general assistance. Focus on:
      - Helpful and accurate information
      - Clear communication
      - Appropriate escalation when needed`,
    };

    return rolePrompts[role] || rolePrompts.default;
  }

  /**
   * Get context-specific prompt
   * @param {Object} context - Context object
   * @returns {string} Context-specific instructions
   */
  getContextPrompt(context) {
    let contextPrompt = '';

    if (context.machine) {
      contextPrompt += `\nMachine Context:
      - Model: ${context.machine.model}
      - Serial Number: ${context.machine.serialNumber}
      - Status: ${context.machine.status}
      - Manufacturer: ${context.machine.specifications?.manufacturer || 'Unknown'}`;
    }

    if (context.ticket) {
      contextPrompt += `\nTicket Context:
      - Ticket Number: ${context.ticket.ticketNumber}
      - Category: ${context.ticket.category}
      - Priority: ${context.ticket.priority}
      - Status: ${context.ticket.status}`;
    }

    if (context.recentTickets && context.recentTickets.length > 0) {
      contextPrompt += `\nRecent Issues:
      ${context.recentTickets.map(ticket => `- ${ticket.title} (${ticket.status})`).join('\n')}`;
    }

    return contextPrompt;
  }

  /**
   * Calculate confidence score for AI response
   * @param {Object} response - Claude response object
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(response) {
    // This is a simplified confidence calculation for Claude
    const stopReason = response.stop_reason;
    
    if (stopReason === 'end_turn') {
      return 0.9; // High confidence for complete responses
    } else if (stopReason === 'max_tokens') {
      return 0.7; // Medium confidence for length-limited responses
    } else if (stopReason === 'stop_sequence') {
      return 0.8; // Good confidence for stop sequence
    } else {
      return 0.6; // Default confidence
    }
  }

  /**
   * Extract suggested actions from AI response
   * @param {string} response - AI response text
   * @returns {Array} Array of suggested actions
   */
  extractSuggestedActions(response) {
    const actions = [];
    
    // Simple pattern matching for suggested actions
    const actionPatterns = [
      /check\s+([^.!?]+)/gi,
      /verify\s+([^.!?]+)/gi,
      /contact\s+([^.!?]+)/gi,
      /schedule\s+([^.!?]+)/gi,
      /replace\s+([^.!?]+)/gi,
      /update\s+([^.!?]+)/gi,
    ];

    actionPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          actions.push({
            action: match.trim(),
            description: `Suggested action: ${match.trim()}`,
            priority: 'medium',
          });
        });
      }
    });

    return actions.slice(0, 3); // Limit to 3 actions
  }

  /**
   * Determine if the issue should be escalated
   * @param {number} confidence - AI confidence score
   * @param {string} userInput - Original user input
   * @param {string} aiResponse - AI response
   * @returns {boolean} Whether to escalate
   */
  shouldEscalate(confidence, userInput, aiResponse) {
    // Escalate if confidence is below threshold
    if (confidence < this.escalationThreshold) {
      return true;
    }

    // Escalate if response contains escalation keywords
    const escalationKeywords = [
      'escalate',
      'contact support',
      'call technician',
      'human assistance',
      'unable to help',
      'complex issue',
      'safety concern',
    ];

    const responseLower = aiResponse.toLowerCase();
    return escalationKeywords.some(keyword => responseLower.includes(keyword));
  }

  /**
   * Generate response for specific AI features
   * @param {string} feature - AI feature type
   * @param {Object} params - Feature parameters
   * @returns {Object} Feature-specific response
   */
  async generateFeatureResponse(feature, params) {
    const featureHandlers = {
      ticketCreation: this.handleTicketCreation,
      knowledgeBaseSearch: this.handleKnowledgeBaseSearch,
      customerDataAccess: this.handleCustomerDataAccess,
      technicalSupport: this.handleTechnicalSupport,
      escalation: this.handleEscalation,
      analytics: this.handleAnalytics,
      systemManagement: this.handleSystemManagement,
      aiTraining: this.handleAITraining,
    };

    const handler = featureHandlers[feature];
    if (!handler) {
      throw new Error(`Unknown AI feature: ${feature}`);
    }

    return await handler.call(this, params);
  }

  /**
   * Handle ticket creation assistance
   */
  async handleTicketCreation(params) {
    const { userInput, user, machine } = params;
    
    const prompt = `Help the user create a support ticket. Analyze their issue and suggest:
    1. Appropriate ticket category
    2. Priority level
    3. Detailed description
    4. Any additional information needed
    
    User input: ${userInput}
    Machine: ${machine ? `${machine.model} (${machine.serialNumber})` : 'Not specified'}`;

    return await this.generateResponse(prompt, user);
  }

  /**
   * Handle knowledge base search
   */
  async handleKnowledgeBaseSearch(params) {
    const { query, user } = params;
    
    const prompt = `Search the knowledge base for information related to: ${query}
    Provide relevant documentation, FAQs, and guides.`;

    return await this.generateResponse(prompt, user);
  }

  /**
   * Handle customer data access
   */
  async handleCustomerDataAccess(params) {
    const { customerId, user } = params;
    
    const prompt = `Provide customer data access for customer ID: ${customerId}
    Include relevant information for the user's role: ${user.role}`;

    return await this.generateResponse(prompt, user);
  }

  /**
   * Handle technical support
   */
  async handleTechnicalSupport(params) {
    const { issue, user, machine } = params;
    
    const prompt = `Provide technical support for: ${issue}
    Machine: ${machine ? `${machine.model} (${machine.serialNumber})` : 'Not specified'}
    User role: ${user.role}`;

    return await this.generateResponse(prompt, user);
  }

  /**
   * Handle escalation
   */
  async handleEscalation(params) {
    const { reason, user } = params;
    
    const prompt = `Handle escalation request. Reason: ${reason}
    User role: ${user.role}
    Provide escalation guidance and next steps.`;

    return await this.generateResponse(prompt, user);
  }

  /**
   * Handle analytics
   */
  async handleAnalytics(params) {
    const { query, user } = params;
    
    const prompt = `Provide analytics insights for: ${query}
    User role: ${user.role}
    Focus on relevant metrics and trends.`;

    return await this.generateResponse(prompt, user);
  }

  /**
   * Handle system management
   */
  async handleSystemManagement(params) {
    const { task, user } = params;
    
    const prompt = `Assist with system management task: ${task}
    User role: ${user.role}
    Provide appropriate guidance and procedures.`;

    return await this.generateResponse(prompt, user);
  }

  /**
   * Handle AI training
   */
  async handleAITraining(params) {
    const { trainingData, user } = params;
    
    const prompt = `Assist with AI training using data: ${JSON.stringify(trainingData)}
    User role: ${user.role}
    Provide training guidance and best practices.`;

    return await this.generateResponse(prompt, user);
  }
}

module.exports = new AIService();
