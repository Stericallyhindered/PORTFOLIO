import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// #region agent log
if (typeof fetch !== 'undefined') {
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db/prisma.ts:14',message:'Prisma client initialized',data:{hasPrisma:!!prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AB'})}).catch(()=>{});
}
// #endregion

