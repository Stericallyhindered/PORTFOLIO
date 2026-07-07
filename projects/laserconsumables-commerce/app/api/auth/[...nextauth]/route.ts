import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const handler = NextAuth(authOptions)

// Wrap handlers with logging
export async function GET(req: any, context: any) {
  // #region agent log
  if (typeof fetch !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:8',message:'NextAuth GET called',data:{path:req?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Y'})}).catch(()=>{});
  }
  // #endregion
  try {
    const result = await handler(req, context)
    // #region agent log
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:14',message:'NextAuth GET result',data:{hasResponse:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'Z'})}).catch(()=>{});
    }
    // #endregion
    return result
  } catch (error) {
    // #region agent log
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:20',message:'NextAuth GET error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AA'})}).catch(()=>{});
    }
    // #endregion
    throw error
  }
}

export async function POST(req: any, context: any) {
  // #region agent log
  if (typeof fetch !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:28',message:'NextAuth POST called',data:{path:req?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AB'})}).catch(()=>{});
  }
  // #endregion
  try {
    const result = await handler(req, context)
    // #region agent log
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:34',message:'NextAuth POST result',data:{hasResponse:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AC'})}).catch(()=>{});
    }
    // #endregion
    return result
  } catch (error) {
    // #region agent log
    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:40',message:'NextAuth POST error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AD'})}).catch(()=>{});
    }
    // #endregion
    throw error
  }
}

