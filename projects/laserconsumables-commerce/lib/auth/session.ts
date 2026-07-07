import { getServerSession } from 'next-auth'
import { authOptions } from './config'

export async function getSession() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:4',message:'getSession called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AC'})}).catch(()=>{});
  // #endregion
  try {
    const session = await getServerSession(authOptions)
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:7',message:'getSession result',data:{hasSession:!!session,hasUser:!!session?.user,userRole:session?.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AD'})}).catch(()=>{});
    // #endregion
    return session
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:10',message:'getSession error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AE'})}).catch(()=>{});
    // #endregion
    throw error
  }
}

export async function getCurrentUser() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:15',message:'getCurrentUser called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AF'})}).catch(()=>{});
  // #endregion
  const session = await getSession()
  const user = session?.user
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:18',message:'getCurrentUser result',data:{hasUser:!!user,userRole:user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AG'})}).catch(()=>{});
  // #endregion
  return user
}

export async function requireAuth() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:20',message:'requireAuth called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AH'})}).catch(()=>{});
  // #endregion
  const session = await getSession()
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:23',message:'requireAuth checking session',data:{hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AI'})}).catch(()=>{});
  // #endregion
  if (!session) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:26',message:'requireAuth - no session, throwing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AJ'})}).catch(()=>{});
    // #endregion
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:21',message:'requireAdmin called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'V'})}).catch(()=>{});
  // #endregion
  const session = await requireAuth()
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:24',message:'requireAdmin - checking role',data:{userRole:session.user.role,roleMatch:session.user.role === 'ADMIN'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'W'})}).catch(()=>{});
  // #endregion
  if (session.user.role !== 'ADMIN') {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/session.ts:26',message:'requireAdmin - role mismatch',data:{userRole:session.user.role,expected:'ADMIN'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'X'})}).catch(()=>{});
    // #endregion
    throw new Error('Forbidden: Admin access required')
  }
  return session
}

