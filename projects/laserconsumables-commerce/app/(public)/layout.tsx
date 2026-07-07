import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getCurrentUserSafe() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(public)/layout.tsx:4',message:'getCurrentUserSafe called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AM'})}).catch(()=>{});
  // #endregion
  try {
    const { getCurrentUser } = await import('@/lib/auth/session')
    const user = await getCurrentUser()
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(public)/layout.tsx:8',message:'getCurrentUserSafe result',data:{hasUser:!!user,userRole:user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AN'})}).catch(()=>{});
    // #endregion
    return user
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(public)/layout.tsx:11',message:'getCurrentUserSafe error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AO'})}).catch(()=>{});
    // #endregion
    return null
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserSafe()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b-2 border-red-600 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center">
              <img 
                src="https://laserconsumables.com/cdn/shop/files/a66a5d4c-9d2c-446a-85c6-54f9fc311f8b.png?v=1714603007&width=200" 
                alt="Laser Consumables" 
                className="h-12 w-auto"
              />
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/products" className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                Products
              </Link>
              <Link href="/collections" className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                Collections
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                Cart
              </Link>
              {user ? (
                <Link href="/account">
                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                    Account
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                    Sign In
                  </Button>
                </Link>
              )}
              <Link href="/admin/dashboard" className="text-xs text-gray-500 hover:text-red-600 transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-black text-white py-12 mt-auto border-t border-red-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-600">About</h3>
              <p className="text-gray-400">Premium laser consumables and equipment for your business needs.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-600">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products" className="hover:text-red-600 transition-colors">Products</Link></li>
                <li><Link href="/collections" className="hover:text-red-600 transition-colors">Collections</Link></li>
                <li><Link href="/cart" className="hover:text-red-600 transition-colors">Cart</Link></li>
                <li><Link href="/admin/dashboard" className="hover:text-red-600 transition-colors">Admin Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-600">Contact</h3>
              <p className="text-gray-400">For inquiries, please contact us through our website.</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Laser Consumables. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

