import { Resend } from 'resend';
import Stripe from 'stripe';
// `@vercel/blob` exports individual helper functions (put, del, list, get…).
// Import the full namespace to access them directly.
import * as vercelBlob from '@vercel/blob';

/**
 * Detects if code is being executed during Next.js build process.
 * 
 * During build, Next.js statically evaluates modules to collect metadata
 * and generate static pages. This can cause issues if those modules try
 * to access external services or require environment variables.
 */
export const isBuildTime =
  (process.env.NEXT_PHASE?.includes('build') ?? false) ||
  process.env.NEXT_PHASE === 'phase-export';

/**
 * Logs a build-time initialization message for a service
 */
function logBuildTimeInit(serviceName: string): void {
  if (isBuildTime) {
    console.log(`[services-init] Using build-time stub for ${serviceName}`);
  }
}

// ---------------------------------------------------------------------------
// STRIPE INITIALIZATION
// ---------------------------------------------------------------------------
let stripe: Stripe;

if (process.env.STRIPE_SECRET_KEY && !isBuildTime) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  });
} else {
  logBuildTimeInit('Stripe');
  // Provide a typed no-op stub during build
  stripe = {
    paymentIntents: {
      create: async () => ({ id: 'build-time-stub' }) as any,
      retrieve: async () => ({ id: 'build-time-stub' }) as any,
      confirm: async () => ({ id: 'build-time-stub' }) as any,
    },
    customers: {
      create: async () => ({ id: 'build-time-stub' }) as any,
      retrieve: async () => ({ id: 'build-time-stub' }) as any,
      update: async () => ({ id: 'build-time-stub' }) as any,
    },
    paymentMethods: {
      list: async () => ({ data: [] }) as any,
      attach: async () => ({ id: 'build-time-stub' }) as any,
      detach: async () => ({ id: 'build-time-stub' }) as any,
    },
    subscriptions: {
      create: async () => ({ id: 'build-time-stub' }) as any,
      retrieve: async () => ({ 
        id: 'build-time-stub',
        items: { data: [{ id: 'item-stub' }] } 
      }) as any,
      update: async () => ({ id: 'build-time-stub' }) as any,
      cancel: async () => ({ id: 'build-time-stub' }) as any,
    },
    prices: {
      list: async () => ({ data: [] }) as any,
      create: async () => ({ id: 'build-time-stub' }) as any,
    },
    products: {
      create: async () => ({ id: 'build-time-stub' }) as any,
    },
    webhooks: {
      constructEvent: () => ({ type: 'build-time-stub' }) as any,
    }
  } as unknown as Stripe;

  // Still throw at runtime if not in build mode
  if (!isBuildTime && !process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
}

// ---------------------------------------------------------------------------
// RESEND INITIALIZATION (Email Service)
// ---------------------------------------------------------------------------
let resend: Resend;

if (process.env.RESEND_API_KEY && !isBuildTime) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  logBuildTimeInit('Resend');
  // Provide a typed stub during build
  resend = {
    emails: {
      send: async () => ({ id: 'build-time-stub', data: null }) as any,
    },
  } as unknown as Resend;

  // Still throw at runtime if not in build mode
  if (!isBuildTime && !process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }
}

// ---------------------------------------------------------------------------
// VERCEL BLOB INITIALIZATION
// ---------------------------------------------------------------------------
let blobService: typeof vercelBlob | {
  put: (...args: any[]) => Promise<any>;
  del: (...args: any[]) => Promise<void>;
  list: (...args: any[]) => Promise<any>;
  get: (...args: any[]) => Promise<any>;
};

if (!isBuildTime) {
  // At runtime we can use the real helpers directly; they accept tokens via options.
  blobService = vercelBlob;
} else {
  logBuildTimeInit('Vercel Blob');
  // Provide a typed stub during build
  blobService = {
    put: async () => ({ url: 'https://example.com/build-time-stub' }) as any,
    del: async () => {},
    list: async () => ({ blobs: [] }) as any,
    get: async () => null as any,
  };
}

// ---------------------------------------------------------------------------
// DROPBOX INITIALIZATION
// ---------------------------------------------------------------------------
// If Dropbox is used, add similar initialization here
// This is a placeholder for Dropbox initialization
const dropboxClient = {
  // Add Dropbox client stub methods here
};

// Export all services
export {
  stripe,
  resend,
  blobService,
  dropboxClient,
};

/**
 * Helper function to check if an environment variable is available
 * and throw a consistent error if not (but only at runtime, not build time)
 */
export function requireEnv(name: string, errorMessage?: string): string {
  const value = process.env[name];
  
  if (!value && !isBuildTime) {
    throw new Error(errorMessage || `${name} is not set in environment variables`);
  }
  
  return value || 'build-time-placeholder';
}

/**
 * Helper function to safely access environment variables that might be undefined
 * during build time, with a default value
 */
export function safeEnv(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}
