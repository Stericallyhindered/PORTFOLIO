-- Complete Database Setup for Bass Clown Co
-- Paste this entire file into Neon SQL Editor

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'member' NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    avatar TEXT,
    bio TEXT,
    phone VARCHAR(20),
    location VARCHAR(255),
    website VARCHAR(255),
    social_links JSONB DEFAULT '{}',
    points_balance INTEGER DEFAULT 0,
    subscription VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    stripe_customer_id VARCHAR(255),
    subscription_id VARCHAR(255),
    subscription_period_start TIMESTAMP,
    subscription_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email_idx ON users(email);

-- ============================================
-- CONTESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    image TEXT,
    prize VARCHAR(255) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    application_deadline TIMESTAMP NOT NULL,
    submission_deadline TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    category VARCHAR(100) NOT NULL,
    requirements JSONB DEFAULT '{}',
    judges JSONB DEFAULT '[]',
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    rules TEXT,
    submission_guidelines TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONTEST APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contest_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES contests(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    responses JSONB DEFAULT '{}',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contest_id, user_id)
);

-- ============================================
-- CONTEST SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contest_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES contests(id) NOT NULL,
    application_id UUID REFERENCES contest_applications(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted' NOT NULL,
    score DECIMAL(5,2),
    feedback TEXT,
    judge_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- GIVEAWAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS giveaways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    prize_value VARCHAR(100) NOT NULL,
    max_entries INTEGER,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming' NOT NULL,
    image TEXT,
    rules JSONB DEFAULT '{}',
    prize_items JSONB DEFAULT '[]',
    sponsor VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- GIVEAWAY ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS giveaway_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID REFERENCES giveaways(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    entry_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'entered' NOT NULL,
    user_result VARCHAR(50),
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(giveaway_id, user_id)
);

-- ============================================
-- GIVEAWAY WINNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS giveaway_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID REFERENCES giveaways(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    entry_id UUID REFERENCES giveaway_entries(id) NOT NULL,
    selected_at TIMESTAMP DEFAULT NOW(),
    prize_claim_status VARCHAR(50) DEFAULT 'pending',
    prize_claim_deadline TIMESTAMP,
    testimonial TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- POINTS TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    reference_type VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PAYMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FILE UPLOADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'vercel',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ADMIN ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric VARCHAR(100) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    date TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    contest_updates BOOLEAN DEFAULT true,
    giveaway_updates BOOLEAN DEFAULT true,
    theme VARCHAR(20) DEFAULT 'light',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONTEST JUDGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contest_judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES contests(id) NOT NULL,
    judge_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contest_id, judge_id)
);

-- ============================================
-- JUDGE SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS judge_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES contest_submissions(id) NOT NULL,
    judge_id UUID REFERENCES users(id) NOT NULL,
    contest_id UUID REFERENCES contests(id) NOT NULL,
    criteria_scores JSONB NOT NULL DEFAULT '{}',
    overall_rating DECIMAL(3,2),
    total_score DECIMAL(5,2) NOT NULL,
    comments TEXT,
    judge_notes TEXT,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    time_spent INTEGER,
    confidence DECIMAL(3,2),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, judge_id)
);

-- ============================================
-- JUDGING SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS judging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES contests(id) NOT NULL,
    submission_id UUID REFERENCES contest_submissions(id) NOT NULL,
    session_type VARCHAR(50) DEFAULT 'independent' NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    required_judges INTEGER DEFAULT 3,
    completed_judges INTEGER DEFAULT 0,
    consensus_reached BOOLEAN DEFAULT false,
    final_score DECIMAL(5,2),
    final_decision VARCHAR(50),
    aggregation_method VARCHAR(50) DEFAULT 'average',
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contest_id, submission_id)
);

-- ============================================
-- JUDGE DISCUSSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS judge_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES judging_sessions(id) NOT NULL,
    judge_id UUID REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'comment' NOT NULL,
    reply_to_id UUID REFERENCES judge_discussions(id),
    is_private BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MEDIA KIT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS media_kit_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    preview_image_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MEDIA KITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS media_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    template_id UUID REFERENCES media_kit_templates(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    kit_data JSONB NOT NULL DEFAULT '{}',
    customization JSONB DEFAULT '{}',
    generated_pdf_url TEXT,
    generated_html_url TEXT,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    share_token VARCHAR(100),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MEDIA KIT ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS media_kit_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_kit_id UUID REFERENCES media_kits(id) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    position INTEGER DEFAULT 0,
    is_main_asset BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MEDIA KIT ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS media_kit_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_kit_id UUID REFERENCES media_kits(id) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    visitor_id VARCHAR(255),
    user_id UUID REFERENCES users(id),
    referrer TEXT,
    user_agent TEXT,
    ip_address VARCHAR(45),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DROPBOX SYNC SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dropbox_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false,
    auto_sync BOOLEAN DEFAULT false,
    sync_interval INTEGER DEFAULT 60,
    sync_paths JSONB DEFAULT '[]',
    exclude_patterns JSONB DEFAULT '[]',
    max_file_size BIGINT DEFAULT 104857600,
    allowed_file_types JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DROPBOX SYNC JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dropbox_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    total_files INTEGER DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DROPBOX FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dropbox_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    dropbox_path TEXT NOT NULL,
    local_file_id UUID REFERENCES file_uploads(id),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    dropbox_rev VARCHAR(255) NOT NULL,
    last_modified TIMESTAMP NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    last_sync_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, dropbox_path)
);

-- ============================================
-- W9 FORMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS w9_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    contest_id UUID REFERENCES contests(id),
    giveaway_id UUID REFERENCES giveaways(id),
    business_name TEXT,
    business_type TEXT,
    tax_classification TEXT,
    payee_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    tin_type TEXT NOT NULL,
    tax_id_number TEXT NOT NULL,
    is_certified BOOLEAN DEFAULT false,
    certification_date TIMESTAMP,
    signature TEXT,
    is_subject_to_backup_withholding BOOLEAN DEFAULT false,
    backup_withholding_reason TEXT,
    status TEXT DEFAULT 'draft',
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    form_file_url TEXT,
    supporting_docs_urls TEXT,
    is_valid BOOLEAN DEFAULT false,
    expiration_date TIMESTAMP,
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- W9 FORM SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS w9_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    w9_form_id UUID REFERENCES w9_forms(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    submission_type TEXT NOT NULL,
    context_id UUID,
    prize_value DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP,
    needs_reporting BOOLEAN DEFAULT false,
    reporting_year INTEGER,
    form_1099_sent BOOLEAN DEFAULT false,
    form_1099_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- W9 FORM VERIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS w9_form_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    w9_form_id UUID REFERENCES w9_forms(id) NOT NULL,
    verification_type TEXT NOT NULL,
    verification_provider TEXT,
    verification_result TEXT NOT NULL,
    verification_data TEXT,
    error_code TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- W9 FORM NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS w9_form_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    w9_form_id UUID REFERENCES w9_forms(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    notification_type TEXT NOT NULL,
    notification_status TEXT DEFAULT 'pending',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    delivery_method TEXT DEFAULT 'email',
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BRAND COLLABORATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS brand_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES users(id) NOT NULL,
    creator_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    timeline VARCHAR(255) NOT NULL,
    deliverables JSONB NOT NULL DEFAULT '[]',
    requirements JSONB NOT NULL DEFAULT '{}',
    proposed_terms JSONB NOT NULL DEFAULT '{}',
    agreed_terms JSONB DEFAULT '{}',
    contract_id UUID,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand_id, creator_id, title)
);

-- ============================================
-- BRAND PROPOSALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS brand_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id UUID REFERENCES brand_collaborations(id) NOT NULL,
    proposed_by UUID REFERENCES users(id) NOT NULL,
    proposal_type VARCHAR(50) NOT NULL,
    terms JSONB NOT NULL DEFAULT '{}',
    message TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    timeline VARCHAR(255) NOT NULL,
    deliverables JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- COLLABORATION MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id UUID REFERENCES brand_collaborations(id) NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    receiver_id UUID REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    message_type VARCHAR(50) DEFAULT 'text' NOT NULL,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BRAND CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS brand_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id UUID REFERENCES brand_collaborations(id) NOT NULL UNIQUE,
    contract_type VARCHAR(50) DEFAULT 'standard' NOT NULL,
    terms JSONB NOT NULL DEFAULT '{}',
    signed_by_brand BOOLEAN DEFAULT false,
    signed_by_creator BOOLEAN DEFAULT false,
    brand_signed_at TIMESTAMP,
    creator_signed_at TIMESTAMP,
    contract_document TEXT,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- Note: You'll need to run the setup script to create the admin user with hashed password
-- Or create manually with: 
-- INSERT INTO users (email, name, password, role, email_verified) 
-- VALUES ('david@solheim.tech', 'David Solheim', '<hashed_password>', 'bass-clown-admin', true);


