import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db';

// =============================================================================
// Anthropic Client
// =============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// =============================================================================
// Types
// =============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  referencedMaterials: string[];
}

// =============================================================================
// Get AI Configuration from Database
// =============================================================================

export async function getAIConfig(): Promise<Record<string, string>> {
  const configs = await prisma.aIConfig.findMany();
  const configMap: Record<string, string> = {};
  
  for (const config of configs) {
    configMap[config.key] = config.value;
  }
  
  // Set defaults if not in database
  return {
    model: configMap.model || 'claude-sonnet-4-5-20250929',
    max_tokens: configMap.max_tokens || '4000',
    temperature: configMap.temperature || '0.7',
    ...configMap,
  };
}

// =============================================================================
// Get System Prompt from Database
// =============================================================================

export async function getSystemPrompt(name: string = 'main_system'): Promise<string> {
  const prompt = await prisma.aIPrompt.findUnique({
    where: { name },
  });
  
  if (prompt?.prompt) {
    return prompt.prompt;
  }
  
  return '';
}

// Get all active prompts that form the full system prompt (main_system + greeting + data_collection + response_style)
const SYSTEM_PROMPT_ORDER = ['main_system', 'greeting', 'data_collection', 'response_style'];

export async function getFullSystemPrompt(): Promise<string> {
  const prompts = await prisma.aIPrompt.findMany({
    where: {
      name: { in: SYSTEM_PROMPT_ORDER },
      isActive: true,
    },
  });
  const byName = new Map(prompts.map(p => [p.name, p.prompt]));
  
  const parts: string[] = [];
  for (const name of SYSTEM_PROMPT_ORDER) {
    const text = byName.get(name)?.trim();
    if (text) parts.push(text);
  }
  
  if (parts.length === 0) {
    return `You are a friendly technical support assistant for Stealth Machine Tools. Be conversational and helpful.`;
  }
  
  return parts.join('\n\n');
}

// =============================================================================
// Build Context from Materials
// =============================================================================

export async function buildMaterialsContext(
  machineModel?: string,
  category?: string
): Promise<string> {
  const where: any = { isPublished: true };
  if (machineModel) where.machineModel = machineModel;
  if (category) where.category = category;
  
  const materials = await prisma.supportMaterial.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      fileType: true,
      machineModel: true,
    },
    take: 50, // Limit for context window
  });
  
  if (materials.length === 0) return '';
  
  const materialsList = materials
    .map(m => `- ${m.title} (${m.fileType?.toUpperCase()}) - ${m.category}${m.machineModel ? ` - Machine: ${m.machineModel}` : ''}`)
    .join('\n');
  
  return `\n\nAvailable Support Materials:\n${materialsList}`;
}

// =============================================================================
// Build Products Context
// =============================================================================

export async function buildProductsContext(): Promise<string> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  
  if (products.length === 0) return '';
  
  const productsList = products
    .map(p => `- ${p.modelCode} "${p.displayName}" - ${p.description || p.category}`)
    .join('\n');
  
  return `\n\nStealth Machine Tools Products:\n${productsList}`;
}

// =============================================================================
// Build Components Context
// =============================================================================

export async function buildComponentsContext(): Promise<string> {
  const components = await prisma.component.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  
  if (components.length === 0) return '';
  
  const componentsList = components
    .map(c => `- ${c.name} - ${c.displayName}${c.manufacturer ? ` (${c.manufacturer})` : ''}`)
    .join('\n');
  
  return `\n\nComponent Systems:\n${componentsList}`;
}

// =============================================================================
// Send Chat Message
// =============================================================================

export async function sendChatMessage(
  messages: ChatMessage[],
  options?: {
    machineModel?: string;
    userId?: string;
    sessionId?: string;
  }
): Promise<AIResponse> {
  // Get configuration and prompts from database (all editable in admin)
  const config = await getAIConfig();
  const systemPrompt = await getFullSystemPrompt();
  
  // Build context
  const materialsContext = await buildMaterialsContext(options?.machineModel);
  const productsContext = await buildProductsContext();
  const componentsContext = await buildComponentsContext();
  
  const fullSystemPrompt = `${systemPrompt}${productsContext}${componentsContext}${materialsContext}`;

  // Call Anthropic API
  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: parseInt(config.max_tokens),
    system: fullSystemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Extract content
  const content = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
  
  // Find referenced materials in response
  const referencedMaterials: string[] = [];
  const materialMatches = content.match(/(?:manual|video|guide|document):\s*([^"]+)/gi);
  if (materialMatches) {
    referencedMaterials.push(...materialMatches);
  }

  return {
    content,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    referencedMaterials,
  };
}

// =============================================================================
// Generate Specific Content
// =============================================================================

export async function generateTroubleshootingGuide(
  issue: string,
  machineModel?: string
): Promise<string> {
  const prompt = await getSystemPrompt('troubleshooting');
  const config = await getAIConfig();
  
  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: parseInt(config.max_tokens),
    system: prompt,
    messages: [
      {
        role: 'user',
        content: `Generate a troubleshooting guide for the following issue${machineModel ? ` on a ${machineModel}` : ''}:\n\n${issue}`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generateSafetyReminder(topic: string): Promise<string> {
  const prompt = await getSystemPrompt('safety');
  const config = await getAIConfig();
  
  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: 1000,
    system: prompt || 'You are a safety specialist for industrial CNC machines. Provide clear, concise safety reminders.',
    messages: [
      {
        role: 'user',
        content: `Generate a safety reminder about: ${topic}`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
