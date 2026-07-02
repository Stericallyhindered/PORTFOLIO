'use client'

import React from 'react'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const CustomNav: React.FC = () => {
  return (
    <div className="nav-group">
      <Link
        href="/admin/dashboard"
        className="nav-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          textDecoration: 'none',
          color: 'inherit',
          fontSize: '1rem',
        }}
      >
        <ChevronLeft />
        <span>Full Dashboard</span>
      </Link>
    </div>
  )
}

export default CustomNav
