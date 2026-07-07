import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  varchar, 
  boolean, 
  integer, 
  decimal,
  jsonb,
  uuid,
  primaryKey,
  uniqueIndex,
  bigint
} from 'drizzle-orm/pg-core'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  password: text('password').notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordExpires: timestamp('reset_password_expires'),
  avatar: text('avatar'),
  bio: text('bio'),
  phone: varchar('phone', { length: 20 }),
  location: varchar('location', { length: 255 }),
  website: varchar('website', { length: 255 }),
  socialLinks: jsonb('social_links').$default(() => ({})),
  pointsBalance: integer('points_balance').default(0),
  subscription: varchar('subscription', { length: 50 }).default('free'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('inactive'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  subscriptionPeriodStart: timestamp('subscription_period_start'),
  subscriptionPeriodEnd: timestamp('subscription_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Contests table
export const contests = pgTable('contests', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),
  image: text('image'),
  brandLogo: text('brand_logo'), // Brand/Sponsor logo image URL
  brandName: varchar('brand_name', { length: 255 }), // Brand/Sponsor name
  prize: varchar('prize', { length: 255 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  applicationDeadline: timestamp('application_deadline').notNull(),
  submissionDeadline: timestamp('submission_deadline').notNull(),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  requirements: jsonb('requirements').$default(() => ({})),
  judges: jsonb('judges').$default(() => ([])),
  maxParticipants: integer('max_participants'),
  currentParticipants: integer('current_participants').default(0),
  rules: text('rules'),
  submissionGuidelines: text('submission_guidelines'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Contest Applications table
export const contestApplications = pgTable('contest_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  contestId: uuid('contest_id').references(() => contests.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  responses: jsonb('responses').$default(() => ({})),
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Contest Submissions table
export const contestSubmissions = pgTable('contest_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  contestId: uuid('contest_id').references(() => contests.id).notNull(),
  applicationId: uuid('application_id').references(() => contestApplications.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('submitted').notNull(),
  score: decimal('score', { precision: 5, scale: 2 }),
  feedback: text('feedback'),
  judgeNotes: text('judge_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Giveaways table
export const giveaways = pgTable('giveaways', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  longDescription: text('long_description'),
  prizeValue: varchar('prize_value', { length: 100 }).notNull(),
  maxEntries: integer('max_entries'),
  additionalEntryPrice: decimal('additional_entry_price', { precision: 10, scale: 2 }), // Price for additional entries (e.g., 5.00)
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: varchar('status', { length: 50 }).default('upcoming').notNull(),
  image: text('image'),
  rules: jsonb('rules').$default(() => ({})),
  prizeItems: jsonb('prize_items').$default(() => ([])),
  sponsor: varchar('sponsor', { length: 255 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Giveaway Entries table
export const giveawayEntries = pgTable('giveaway_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  giveawayId: uuid('giveaway_id').references(() => giveaways.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  entryNumber: integer('entry_number').notNull(),
  entryType: varchar('entry_type', { length: 50 }).default('free').notNull(), // 'free' or 'purchased'
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }), // Price paid for additional entries
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }), // For purchased entries
  status: varchar('status', { length: 50 }).default('entered').notNull(),
  userResult: varchar('user_result', { length: 50 }),
  notificationSent: boolean('notification_sent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Giveaway Winners table
export const giveawayWinners = pgTable('giveaway_winners', {
  id: uuid('id').primaryKey().defaultRandom(),
  giveawayId: uuid('giveaway_id').references(() => giveaways.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  entryId: uuid('entry_id').references(() => giveawayEntries.id).notNull(),
  selectedAt: timestamp('selected_at').defaultNow(),
  prizeClaimStatus: varchar('prize_claim_status', { length: 50 }).default('pending'),
  prizeClaimDeadline: timestamp('prize_claim_deadline'),
  testimonial: text('testimonial'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Points Transactions table
export const pointsTransactions = pgTable('points_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'earned', 'spent', 'purchased'
  amount: integer('amount').notNull(),
  description: text('description'),
  referenceId: varchar('reference_id', { length: 255 }), // contest ID, giveaway ID, etc.
  referenceType: varchar('reference_type', { length: 50 }), // 'contest', 'giveaway', 'purchase'
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow()
})

// Payment History table
export const paymentHistory = pgTable('payment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('usd'),
  status: varchar('status', { length: 50 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$default(() => ({})),
  createdAt: timestamp('created_at').defaultNow()
})

// File Uploads table
export const fileUploads = pgTable('file_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  storageProvider: varchar('storage_provider', { length: 50 }).default('vercel'),
  metadata: jsonb('metadata').$default(() => ({})),
  createdAt: timestamp('created_at').defaultNow()
})

// Admin Analytics table
export const adminAnalytics = pgTable('admin_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  metric: varchar('metric', { length: 100 }).notNull(),
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  metadata: jsonb('metadata').$default(() => ({})),
  createdAt: timestamp('created_at').defaultNow()
})

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  metadata: jsonb('metadata').$default(() => ({})),
  createdAt: timestamp('created_at').defaultNow()
})

// User Settings table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  emailNotifications: boolean('email_notifications').default(true),
  pushNotifications: boolean('push_notifications').default(true),
  marketingEmails: boolean('marketing_emails').default(false),
  contestUpdates: boolean('contest_updates').default(true),
  giveawayUpdates: boolean('giveaway_updates').default(true),
  theme: varchar('theme', { length: 20 }).default('light'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Contest Judges table - manages which users can judge which contests
export const contestJudges = pgTable('contest_judges', {
  id: uuid('id').primaryKey().defaultRandom(),
  contestId: uuid('contest_id').references(() => contests.id).notNull(),
  judgeId: uuid('judge_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, inactive, removed
  assignedAt: timestamp('assigned_at').defaultNow(),
  assignedBy: uuid('assigned_by').references(() => users.id),
  permissions: jsonb('permissions').$default(() => ({})), // specific permissions for this judge
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Individual Judge Scores table - stores each judge's scoring for submissions
export const judgeScores = pgTable('judge_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').references(() => contestSubmissions.id).notNull(),
  judgeId: uuid('judge_id').references(() => users.id).notNull(),
  contestId: uuid('contest_id').references(() => contests.id).notNull(),
  criteriaScores: jsonb('criteria_scores').$default(() => ({})).notNull(), // { technique: 8, creativity: 9, etc. }
  overallRating: decimal('overall_rating', { precision: 3, scale: 2 }), // 1-5 rating
  totalScore: decimal('total_score', { precision: 5, scale: 2 }).notNull(), // calculated weighted score
  comments: text('comments'),
  judgeNotes: text('judge_notes'),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, submitted, final
  timeSpent: integer('time_spent'), // time in seconds
  confidence: decimal('confidence', { precision: 3, scale: 2 }), // judge's confidence in their scoring 1-5
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Collaborative Judging Sessions table - manages judging rounds and consensus
export const judgingSessions = pgTable('judging_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  contestId: uuid('contest_id').references(() => contests.id).notNull(),
  submissionId: uuid('submission_id').references(() => contestSubmissions.id).notNull(),
  sessionType: varchar('session_type', { length: 50 }).default('independent').notNull(), // independent, collaborative, consensus
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, completed, cancelled
  requiredJudges: integer('required_judges').default(3),
  completedJudges: integer('completed_judges').default(0),
  consensusReached: boolean('consensus_reached').default(false),
  finalScore: decimal('final_score', { precision: 5, scale: 2 }),
  finalDecision: varchar('final_decision', { length: 50 }), // approved, rejected, needs_review
  aggregationMethod: varchar('aggregation_method', { length: 50 }).default('average'), // average, median, weighted
  metadata: jsonb('metadata').$default(() => ({})), // session configuration and results
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Judge Comments and Discussions table - for collaborative discussions
export const judgeDiscussions = pgTable('judge_discussions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => judgingSessions.id).notNull(),
  judgeId: uuid('judge_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('comment').notNull(), // comment, question, concern, agreement
  replyToId: uuid('reply_to_id'), // for threaded discussions - self-reference added later
  isPrivate: boolean('is_private').default(false), // private notes vs shared discussions
  metadata: jsonb('metadata').$default(() => ({})), // additional context
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Create unique indexes
export const userEmailIdx = uniqueIndex('user_email_idx').on(users.email)
export const contestApplicationUniqueIdx = uniqueIndex('contest_application_unique_idx').on(
  contestApplications.contestId, 
  contestApplications.userId
)
export const giveawayEntryUniqueIdx = uniqueIndex('giveaway_entry_unique_idx').on(
  giveawayEntries.giveawayId, 
  giveawayEntries.userId
)

// New unique indexes for collaborative judging
export const contestJudgeUniqueIdx = uniqueIndex('contest_judge_unique_idx').on(
  contestJudges.contestId,
  contestJudges.judgeId
)
export const judgeScoreUniqueIdx = uniqueIndex('judge_score_unique_idx').on(
  judgeScores.submissionId,
  judgeScores.judgeId
)
export const judgingSessionUniqueIdx = uniqueIndex('judging_session_unique_idx').on(
  judgingSessions.contestId,
  judgingSessions.submissionId
) 

// Media Kit Templates table - predefined templates for different types of media kits
export const mediaKitTemplates = pgTable('media_kit_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'brand', 'creator', 'contest'
  templateData: jsonb('template_data').$default(() => ({})).notNull(), // layout, sections, styling
  isActive: boolean('is_active').default(true),
  isPremium: boolean('is_premium').default(false),
  previewImageUrl: text('preview_image_url'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Media Kits table - generated media kits for users/brands
export const mediaKits = pgTable('media_kits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  templateId: uuid('template_id').references(() => mediaKitTemplates.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'brand', 'creator', 'contest'
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, published, archived
  kitData: jsonb('kit_data').$default(() => ({})).notNull(), // all content, stats, assets
  customization: jsonb('customization').$default(() => ({})), // user customizations to template
  generatedPdfUrl: text('generated_pdf_url'),
  generatedHtmlUrl: text('generated_html_url'),
  isPublic: boolean('is_public').default(false),
  downloadCount: integer('download_count').default(0),
  viewCount: integer('view_count').default(0),
  shareToken: varchar('share_token', { length: 100 }), // for public sharing
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Media Kit Assets table - images, videos, documents in media kits
export const mediaKitAssets = pgTable('media_kit_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaKitId: uuid('media_kit_id').references(() => mediaKits.id).notNull(),
  assetType: varchar('asset_type', { length: 50 }).notNull(), // 'image', 'video', 'document', 'logo'
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  metadata: jsonb('metadata').$default(() => ({})), // dimensions, duration, etc.
  position: integer('position').default(0), // ordering within kit
  isMainAsset: boolean('is_main_asset').default(false), // featured image/video
  createdAt: timestamp('created_at').defaultNow()
})

// Media Kit Analytics table - track views, downloads, shares
export const mediaKitAnalytics = pgTable('media_kit_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaKitId: uuid('media_kit_id').references(() => mediaKits.id).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'view', 'download', 'share', 'contact'
  visitorId: varchar('visitor_id', { length: 255 }), // anonymous visitor tracking
  userId: uuid('user_id').references(() => users.id), // if logged in
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  metadata: jsonb('metadata').$default(() => ({})), // additional event data
  createdAt: timestamp('created_at').defaultNow()
}) 

// Dropbox Sync Settings table - user sync preferences and configuration
export const dropboxSyncSettings = pgTable('dropbox_sync_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  enabled: boolean('enabled').default(false),
  autoSync: boolean('auto_sync').default(false),
  syncInterval: integer('sync_interval').default(60), // minutes
  syncPaths: jsonb('sync_paths').$default(() => []).$type<string[]>(), // array of paths to sync
  excludePatterns: jsonb('exclude_patterns').$default(() => []).$type<string[]>(), // array of patterns to exclude
  maxFileSize: bigint('max_file_size', { mode: 'number' }).default(100 * 1024 * 1024), // bytes
  allowedFileTypes: jsonb('allowed_file_types').$default(() => []).$type<string[]>(), // array of allowed file types
  settings: jsonb('settings').$default(() => ({})), // additional configuration
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Dropbox Sync Jobs table - track sync operations
export const dropboxSyncJobs = pgTable('dropbox_sync_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, running, completed, failed, cancelled
  jobType: varchar('job_type', { length: 50 }).notNull(), // full_sync, incremental, upload, download
  totalFiles: integer('total_files').default(0),
  processedFiles: integer('processed_files').default(0),
  failedFiles: integer('failed_files').default(0),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$default(() => ({})), // job configuration and results
  createdAt: timestamp('created_at').defaultNow()
})

// Dropbox Files table - track synced files and their status
export const dropboxFiles = pgTable('dropbox_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  dropboxPath: text('dropbox_path').notNull(),
  localFileId: uuid('local_file_id').references(() => fileUploads.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  dropboxRev: varchar('dropbox_rev', { length: 255 }).notNull(),
  lastModified: timestamp('last_modified').notNull(),
  syncStatus: varchar('sync_status', { length: 50 }).default('pending').notNull(), // synced, pending, conflict, error
  lastSyncAt: timestamp('last_sync_at'),
  metadata: jsonb('metadata').$default(() => ({})), // additional file metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Create unique indexes for Dropbox sync tables
export const dropboxFileUniqueIdx = uniqueIndex('dropbox_file_unique_idx').on(
  dropboxFiles.userId,
  dropboxFiles.dropboxPath
)

// W9 Form Handling Tables
export const w9Forms = pgTable('w9_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  contestId: uuid('contest_id').references(() => contests.id),
  giveawayId: uuid('giveaway_id').references(() => giveaways.id),
  
  // Form data
  businessName: text('business_name'),
  businessType: text('business_type'), // individual, sole_proprietor, partnership, corporation, llc, etc.
  taxClassification: text('tax_classification'),
  payeeName: text('payee_name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  
  // Tax identification
  tinType: text('tin_type').notNull(), // ssn, ein
  taxIdNumber: text('tax_id_number').notNull(), // encrypted
  
  // Certification
  isCertified: boolean('is_certified').default(false),
  certificationDate: timestamp('certification_date'),
  signature: text('signature'), // base64 encoded signature image
  
  // Backup withholding
  isSubjectToBackupWithholding: boolean('is_subject_to_backup_withholding').default(false),
  backupWithholdingReason: text('backup_withholding_reason'),
  
  // Status and processing
  status: text('status').default('draft'), // draft, submitted, approved, rejected, expired
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  
  // File attachments
  formFileUrl: text('form_file_url'), // PDF of completed form
  supportingDocsUrls: text('supporting_docs_urls'), // JSON array of URLs
  
  // Compliance
  isValid: boolean('is_valid').default(false),
  expirationDate: timestamp('expiration_date'),
  lastVerifiedAt: timestamp('last_verified_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const w9FormSubmissions = pgTable('w9_form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  w9FormId: uuid('w9_form_id').references(() => w9Forms.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Submission context
  submissionType: text('submission_type').notNull(), // contest_win, giveaway_win, payment_request
  contextId: uuid('context_id'), // ID of contest, giveaway, etc.
  prizeValue: decimal('prize_value', { precision: 10, scale: 2 }),
  
  // Processing status
  status: text('status').default('pending'), // pending, processing, completed, failed
  processedAt: timestamp('processed_at'),
  
  // IRS reporting
  needsReporting: boolean('needs_reporting').default(false),
  reportingYear: integer('reporting_year'),
  form1099Sent: boolean('form_1099_sent').default(false),
  form1099SentAt: timestamp('form_1099_sent_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const w9FormVerifications = pgTable('w9_form_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  w9FormId: uuid('w9_form_id').references(() => w9Forms.id).notNull(),
  
  // Verification details
  verificationType: text('verification_type').notNull(), // tin_match, name_match, address_verification
  verificationProvider: text('verification_provider'), // irs, third_party_service
  verificationResult: text('verification_result').notNull(), // verified, failed, pending
  verificationData: text('verification_data'), // JSON data from verification service
  
  // Error handling
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow()
});

export const w9FormNotifications = pgTable('w9_form_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  w9FormId: uuid('w9_form_id').references(() => w9Forms.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Notification details
  notificationType: text('notification_type').notNull(), // form_required, form_submitted, form_approved, form_rejected, form_expiring
  notificationStatus: text('notification_status').default('pending'), // pending, sent, failed
  
  // Content
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  
  // Delivery
  deliveryMethod: text('delivery_method').default('email'), // email, sms, in_app
  sentAt: timestamp('sent_at'),
  readAt: timestamp('read_at'),
  
  // Metadata
  metadata: text('metadata'), // JSON for additional data
  
  createdAt: timestamp('created_at').defaultNow()
});

// Brand Collaborations table - collaboration opportunities between brands and creators
export const brandCollaborations = pgTable('brand_collaborations', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').references(() => users.id).notNull(),
  creatorId: uuid('creator_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // sponsored_content, product_review, brand_ambassador, etc.
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, proposed, under_review, negotiating, approved, active, completed, cancelled, disputed
  budget: decimal('budget', { precision: 10, scale: 2 }).notNull(),
  timeline: varchar('timeline', { length: 255 }).notNull(),
  deliverables: jsonb('deliverables').$default(() => ([])).notNull(), // array of deliverable descriptions
  requirements: jsonb('requirements').$default(() => ({})).notNull(), // array of requirements
  proposedTerms: jsonb('proposed_terms').$default(() => ({})).notNull(), // initial terms from brand
  agreedTerms: jsonb('agreed_terms').$default(() => ({})), // final agreed terms
  contractId: uuid('contract_id'), // reference to contract
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Brand Proposals table - track proposal negotiations
export const brandProposals = pgTable('brand_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  collaborationId: uuid('collaboration_id').references(() => brandCollaborations.id).notNull(),
  proposedBy: uuid('proposed_by').references(() => users.id).notNull(),
  proposalType: varchar('proposal_type', { length: 50 }).notNull(), // initial, counter, revision
  terms: jsonb('terms').$default(() => ({})).notNull(),
  message: text('message').notNull(),
  budget: decimal('budget', { precision: 10, scale: 2 }).notNull(),
  timeline: varchar('timeline', { length: 255 }).notNull(),
  deliverables: jsonb('deliverables').$default(() => ([])).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, accepted, rejected, expired
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow()
})

// Collaboration Messages table - communication between brands and creators
export const collaborationMessages = pgTable('collaboration_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  collaborationId: uuid('collaboration_id').references(() => brandCollaborations.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments').$default(() => ([])), // array of file URLs
  messageType: varchar('message_type', { length: 50 }).default('text').notNull(), // text, proposal, contract, milestone, feedback
  metadata: jsonb('metadata').$default(() => ({})), // additional message data
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow()
})

// Brand Contracts table - legal agreements for collaborations
export const brandContracts = pgTable('brand_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  collaborationId: uuid('collaboration_id').references(() => brandCollaborations.id).notNull(),
  contractType: varchar('contract_type', { length: 50 }).default('standard').notNull(), // standard, custom
  terms: jsonb('terms').$default(() => ({})).notNull(),
  signedByBrand: boolean('signed_by_brand').default(false),
  signedByCreator: boolean('signed_by_creator').default(false),
  brandSignedAt: timestamp('brand_signed_at'),
  creatorSignedAt: timestamp('creator_signed_at'),
  contractDocument: text('contract_document'), // URL to contract PDF
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, pending_signatures, signed, expired, terminated
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Create unique indexes for brand collaboration tables
export const brandCollaborationUniqueIdx = uniqueIndex('brand_collaboration_unique_idx').on(
  brandCollaborations.brandId,
  brandCollaborations.creatorId,
  brandCollaborations.title
)

export const brandContractUniqueIdx = uniqueIndex('brand_contract_unique_idx').on(
  brandContracts.collaborationId
)

// Portfolio Videos table - showcase commercials and portfolio work
export const portfolioVideos = pgTable('portfolio_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  category: varchar('category', { length: 100 }).default('commercial'), // commercial, reel, testimonial, etc.
  clientName: varchar('client_name', { length: 255 }),
  featured: boolean('featured').default(false), // for homepage/featured section
  featuredOrder: integer('featured_order').default(0), // order in featured section
  displayOrder: integer('display_order').default(0), // order in portfolio grid
  published: boolean('published').default(true),
  views: integer('views').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Blog Posts table
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(), // URL-friendly slug
  excerpt: text('excerpt'), // Short summary for listings
  content: text('content').notNull(), // Full blog post content (can include HTML)
  featuredImage: text('featured_image'), // Main image URL
  images: jsonb('images').$default(() => ([])), // Array of image URLs
  videos: jsonb('videos').$default(() => ([])), // Array of video URLs with metadata
  category: varchar('category', { length: 100 }).default('General'),
  tags: jsonb('tags').$default(() => ([])), // Array of tag strings
  authorId: uuid('author_id').references(() => users.id),
  authorName: varchar('author_name', { length: 255 }), // Cached author name
  published: boolean('published').default(false),
  publishedAt: timestamp('published_at'), // When it was published
  featured: boolean('featured').default(false), // Featured post
  views: integer('views').default(0),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  metaKeywords: jsonb('meta_keywords').$default(() => ([])),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}) 