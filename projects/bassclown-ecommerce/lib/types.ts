import { TypeIcon as IconType } from "lucide-react";
import { DivideIcon as LucideIcon } from "lucide-react";
import { z } from "zod";
import { LucideIcon as LucideIconType } from "lucide-react";

export interface ServiceBlock {
  title: string;
  description: string;
  bannerColor: string; // "orange" or "blue"
  polaroidImage?: string;
  polaroidVideo?: string;
  polaroidCaption: string;
  icon: string;
  expandedDescription?: string;
}

export interface NavItem {
  label: string;
  href: string;
  subItems?: NavItem[];
}

export interface Service {
  title: string;
  description: string;
  icon: LucideIconType;
  image: string;
}

export interface Project {
  title: string;
  description: string;
  image: string;
  category: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export const videoReviewFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  company: z.string().min(1, { message: "Please enter a company name" }),
  description: z.string().min(10, { message: "Message must be at least 10 characters" }),
  streetAddress: z.string().min(1, { message: "Please enter a street address" }),
  city: z.string().min(1, { message: "Please enter a city" }),
  state: z.string().min(1, { message: "Please enter a state" }),
  zipCode: z.string().min(1, { message: "Please enter a zip code" }),
  website: z.string().optional(), // Honeypot field
});

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  service: z.string().min(1, { message: "Please select a service" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});


export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type VideoReviewFormValues = z.infer<typeof videoReviewFormSchema>;
// Contest Types
export interface Contest {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  prize: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  submissionDeadline: string;
  status: 'draft' | 'open' | 'closed' | 'judging' | 'completed';
  category: string;
  requirements: string[];
  judges: string[];
  maxParticipants: number;
  currentParticipants: number;
  rules: string;
  submissionGuidelines: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContestApplication {
  id: string;
  contestId: string;
  userId: string;
  userEmail: string;
  userName: string;
  applicationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  responses: Record<string, string>;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ContestSubmission {
  id: string;
  contestId: string;
  applicationId: string;
  userId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: 'video' | 'image' | 'document';
  submissionDate: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  score?: number;
  feedback?: string;
  judgeNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ContestCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Contest Form Schemas
export const contestApplicationSchema = z.object({
  experience: z.string().min(50, { message: "Please describe your experience (minimum 50 characters)" }),
  portfolio: z.string().url({ message: "Please provide a valid portfolio URL" }).optional().or(z.literal("")),
  motivation: z.string().min(100, { message: "Please explain your motivation (minimum 100 characters)" }),
  equipment: z.string().min(20, { message: "Please describe your equipment (minimum 20 characters)" }),
  availability: z.string().min(20, { message: "Please describe your availability (minimum 20 characters)" }),
  additionalInfo: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export const contestSubmissionSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(50, { message: "Description must be at least 50 characters" }),
  file: z.any().refine((file) => file instanceof File, {
    message: "Please upload a file",
  }),
  tags: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type ContestApplicationValues = z.infer<typeof contestApplicationSchema>;
export type ContestSubmissionValues = z.infer<typeof contestSubmissionSchema>;

// Contest Status Types
export type ContestApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ContestSubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
export type ContestStatus = 'draft' | 'open' | 'closed' | 'judging' | 'completed';

// Giveaway Types
export interface Giveaway {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  prizeValue: string;
  entryCount: number;
  maxEntries: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'upcoming' | 'ended';
  image?: string;
  rules?: string[];
  prizeItems?: string[];
  sponsor?: string;
  userHasEntered?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
}

export interface GiveawayEntry {
  id: string;
  giveawayId: string;
  userId: string;
  userEmail: string;
  userName: string;
  entryDate: Date;
  entryNumber: number;
  status: 'entered' | 'withdrawn';
  userResult?: 'won' | 'lost' | null;
  notificationSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GiveawayWinner {
  id: string;
  giveawayId: string;
  userId: string;
  userEmail: string;
  userName: string;
  entryId: string;
  selectedAt: Date;
  prizeClaimStatus: 'pending' | 'claimed' | 'unclaimed' | 'forfeited';
  prizeClaimDeadline: Date;
  testimonial?: string;
  location?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiveawayStats {
  totalGiveaways: number;
  totalPrizeValue: number;
  totalEntries: number;
  userEntries: number;
  userWins: number;
  userWinRate: number;
}

// Giveaway Form Schemas
export const giveawayEntrySchema = z.object({
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  emailOptIn: z.boolean().optional(),
  shareOnSocial: z.boolean().optional(),
});

export type GiveawayEntryValues = z.infer<typeof giveawayEntrySchema>;

// Giveaway Status Types
export type GiveawayStatus = 'active' | 'upcoming' | 'ended';
export type GiveawayEntryStatus = 'entered' | 'withdrawn';
export type GiveawayResult = 'won' | 'lost' | null;
export type PrizeClaimStatus = 'pending' | 'claimed' | 'unclaimed' | 'forfeited';
