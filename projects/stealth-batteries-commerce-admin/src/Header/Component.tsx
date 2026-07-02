import { HeaderClient } from './Component.client'
import React from 'react'

interface HeaderProps {
  isAdmin: boolean
}

export async function Header({ isAdmin }: HeaderProps) {
  return <HeaderClient isAdmin={isAdmin} />
}
