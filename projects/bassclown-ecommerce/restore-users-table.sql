-- Restore Users Table from Production Backup
-- Paste this into Neon SQL Editor

-- This dump only contains the users table, not the full database
-- The database schema (all 33 tables) already exists

-- Drop and recreate users table with data
DROP INDEX IF EXISTS public.user_email_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
DROP TABLE IF EXISTS public.users;

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    password text NOT NULL,
    role character varying(50) DEFAULT 'member'::character varying NOT NULL,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    reset_password_token character varying(255),
    reset_password_expires timestamp without time zone,
    avatar text,
    bio text,
    phone character varying(20),
    location character varying(255),
    website character varying(255),
    social_links jsonb,
    points_balance integer DEFAULT 0,
    subscription character varying(50) DEFAULT 'free'::character varying,
    subscription_status character varying(50) DEFAULT 'inactive'::character varying,
    stripe_customer_id character varying(255),
    subscription_id character varying(255),
    subscription_period_start timestamp without time zone,
    subscription_period_end timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- Insert production user data
INSERT INTO public.users (
    id, 
    email, 
    name, 
    password, 
    role, 
    email_verified, 
    email_verification_token, 
    reset_password_token, 
    reset_password_expires, 
    avatar, 
    bio, 
    phone, 
    location, 
    website, 
    social_links, 
    points_balance, 
    subscription, 
    subscription_status, 
    stripe_customer_id, 
    subscription_id, 
    subscription_period_start, 
    subscription_period_end, 
    created_at, 
    updated_at
) VALUES (
    'a5d43632-6d73-4e83-91a7-07b5a2af0e64',
    'david@solheim.tech',
    'David Solheim',
    '$2b$12$EImRRAZSvzvpWTBdzOrw1.WY2WXlBzoHO4BXmyjVGrBR6C4ro99NC',
    'bass-clown-admin',
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    'free',
    'inactive',
    NULL,
    NULL,
    NULL,
    NULL,
    '2025-07-10 23:07:07.97471',
    '2025-07-10 23:07:07.97471'
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- Add constraints and indexes
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX user_email_idx ON public.users USING btree (email);

-- Verify user was restored
SELECT id, email, name, role, email_verified, created_at
FROM public.users
WHERE email = 'david@solheim.tech';
