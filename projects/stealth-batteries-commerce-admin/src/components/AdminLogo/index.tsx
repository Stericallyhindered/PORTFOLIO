'use client'

import React from 'react'
import { LogoDark } from '../LogoDark/LogoDark'
import { useTheme } from '@/providers/Theme'
import { Logo } from '../Logo/Logo'

const AdminLogo: React.FC = () => {
  const { theme } = useTheme()
  return (
    <div className="w-[193px] h-[34px]">
      {theme === 'dark' ? (
        <LogoDark loading="eager" priority="high" className="w-full h-full" />
      ) : (
        <Logo loading="eager" priority="high" className="w-full h-full" />
      )}
    </div>
  )
}

export default AdminLogo
