'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

const AdminCustomNav: React.FC = () => {
  const router = useRouter()

  return (
    <div style={{ padding: '0 var(--base)' }}>
      <button
        onClick={() => router.push('/admin/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          color: 'var(--theme-elevation-500)',
          fontSize: '1rem',
          fontFamily: 'var(--font-body)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--theme-elevation-800)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--theme-elevation-500)'
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span>Full Dashboard</span>
      </button>
      <div
        style={{
          height: '1px',
          background: 'var(--theme-elevation-100)',
          margin: '12px 0',
        }}
      />
    </div>
  )
}

export default AdminCustomNav
