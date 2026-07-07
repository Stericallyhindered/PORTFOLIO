import { UserRole, MachineStatus, TicketPriority, TicketStatus } from '@prisma/client';

// Re-export Prisma enums
export { UserRole, MachineStatus, TicketPriority, TicketStatus };

// =============================================================================
// API Types
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// =============================================================================
// Auth Types
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profileImage: string | null;
  };
}

// =============================================================================
// User Types
// =============================================================================

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  company: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UserDetail extends UserListItem {
  phone: string | null;
  jobTitle: string | null;
  employeeId: string | null;
  profileImage: string | null;
  machines: MachineListItem[];
  ticketCount: number;
}

// =============================================================================
// Machine Types
// =============================================================================

export interface MachineListItem {
  id: string;
  model: string;
  serialNumber: string;
  machineType: string;
  nickname: string | null;
  status: MachineStatus;
  purchaseDate: Date | null;
}

export interface MachineDetail extends MachineListItem {
  location: string | null;
  notes: string | null;
  specifications: Record<string, unknown> | null;
  warrantyExpiry: Date | null;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// =============================================================================
// Material Types
// =============================================================================

export interface MaterialListItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileType: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  machineModel: string | null;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
}

export interface MaterialDetail extends MaterialListItem {
  fileName: string;
  fileSize: number | null;
  downloadCount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// =============================================================================
// Ticket Types
// =============================================================================

export interface TicketListItem {
  id: string;
  ticketNumber: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
  };
  assignedTo: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface TicketDetail extends TicketListItem {
  description: string;
  resolution: string | null;
  internalNotes: string | null;
  updatedAt: Date;
  resolvedAt: Date | null;
  machine: MachineListItem | null;
  messages: TicketMessageItem[];
}

export interface TicketMessageItem {
  id: string;
  message: string;
  isInternal: boolean;
  attachments: string[];
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

// =============================================================================
// AI Types
// =============================================================================

export interface AIConfigItem {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
}

export interface AIPromptItem {
  id: string;
  name: string;
  displayName: string;
  prompt: string;
  description: string | null;
  variables: string[];
  isActive: boolean;
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  sessionId?: string;
  machineModel?: string;
}

export interface ChatResponse {
  content: string;
  sessionId: string;
  tokensUsed: number;
  referencedMaterials: string[];
}

// =============================================================================
// Training Types
// =============================================================================

export interface TrainingModuleListItem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationMins: number;
  machineModel: string | null;
  isPublished: boolean;
}

export interface TrainingModuleDetail extends TrainingModuleListItem {
  content: string;
  prerequisites: string[];
  objectives: string[];
  videoUrl: string | null;
  attachments: string[];
  quizQuestions: unknown | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingProgressItem {
  moduleId: string;
  status: string;
  progress: number;
  quizScore: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMaterials: number;
  openTickets: number;
  aiConversationsToday: number;
  newUsersThisWeek: number;
}

export interface RecentActivity {
  id: string;
  type: 'user_created' | 'ticket_created' | 'material_uploaded' | 'ticket_resolved';
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

// =============================================================================
// Settings Types
// =============================================================================

export interface AppSettingItem {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  displayName: string;
  description: string | null;
  isPublic: boolean;
}
