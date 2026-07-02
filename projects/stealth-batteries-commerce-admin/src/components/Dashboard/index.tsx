'use client'

import React, { useEffect, useState } from 'react'
import '@payloadcms/next/css'
import '@/styles/dashboard.scss'
import { useTheme } from '@payloadcms/ui'
import Link from 'next/link'

type DashboardStats = {
  totalOrders: number
  totalRevenue: number
  processingOrders: number
  completedOrders: number
  totalCustomers: number
  totalDealers: number
  totalProducts: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    total: number
    createdAt: string
    status: string
    isDropship?: boolean
    dropship?: boolean
    customer?: {
      email: string
    }
    dealer?: {
      name?: string
      companyName?: string
    }
  }>
}

const Dashboard: React.FC = () => {
  const { theme } = useTheme()
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    totalDealers: 0,
    totalProducts: 0,
    recentOrders: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the current session user
        const userRes = await fetch('/api/users/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!userRes.ok) {
          throw new Error('Failed to fetch user')
        }

        const userData = await userRes.json()
        setUser(userData.user || userData)

        // Fetch orders data
        const ordersRes = await fetch('/api/orders?dealerId=all', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!ordersRes.ok) {
          const errorData = await ordersRes.json()
          throw new Error(errorData.error || 'Failed to fetch orders')
        }

        const ordersData = await ordersRes.json()

        // Fetch customers count from customers collection
        const customersRes = await fetch('/api/customers?limit=0', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!customersRes.ok) {
          throw new Error('Failed to fetch customers count')
        }

        const customersData = await customersRes.json()

        // Fetch dealers count from dealers collection
        const dealersRes = await fetch('/api/dealers?limit=0', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!dealersRes.ok) {
          throw new Error('Failed to fetch dealers count')
        }

        const dealersData = await dealersRes.json()

        // Fetch products count from products collection
        const productsRes = await fetch('/api/products?limit=0', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!productsRes.ok) {
          throw new Error('Failed to fetch products count')
        }

        const productsData = await productsRes.json()

        // Fetch recent orders with dealer info
        const recentOrdersRes = await fetch(
          '/api/orders?dealerId=all&limit=5&sort=-createdAt&depth=2',
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          },
        )

        if (!recentOrdersRes.ok) {
          const errorData = await recentOrdersRes.json()
          throw new Error(errorData.error || 'Failed to fetch recent orders')
        }

        const recentOrdersData = await recentOrdersRes.json()

        // Calculate metrics
        const totalRevenue = (ordersData?.docs || []).reduce(
          (acc: number, order: any) => acc + (order.total || 0),
          0,
        )

        const processingOrders = (ordersData?.docs || []).filter(
          (order: any) => order.status?.toLowerCase() === 'processing',
        ).length

        const completedOrders = (ordersData?.docs || []).filter(
          (order: any) => order.status?.toLowerCase() === 'completed',
        ).length

        setStats({
          totalOrders: ordersData?.totalDocs || 0,
          totalRevenue,
          processingOrders,
          completedOrders,
          totalCustomers: customersData?.totalDocs || 0,
          totalDealers: dealersData?.totalDocs || 0,
          totalProducts: productsData?.totalDocs || 0,
          recentOrders: recentOrdersData?.docs || [],
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Loading quick dashboard data...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Error</h2>
          <p className="error-message">{error}</p>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {user?.name ? `Welcome back, ${user.name}` : 'Welcome to the dashboard'}
        </h2>
        <Link
          href="/admin/dashboard"
          className="custom-dashboard-link"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: theme === 'dark' ? '#E54B36' : '#E54B36',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            marginTop: '16px',
            marginBottom: '24px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s ease',
          }}
        >
          View Full Dashboard →
        </Link>
      </div>

      <div className="dashboard-content">
        <div>
          <div className="stats-grid">
            <div className="stats-card">
              <h3 className="stats-card-title">Total Orders</h3>
              <div className="stats-card-value">{stats.totalOrders}</div>
            </div>

            <div className="stats-card">
              <h3 className="stats-card-title">Total Revenue</h3>
              <div className="stats-card-value">${stats.totalRevenue.toFixed(2)}</div>
            </div>

            <div className="stats-card">
              <h3 className="stats-card-title">Processing Orders</h3>
              <div className="stats-card-value processing">{stats.processingOrders}</div>
            </div>

            <div className="stats-card">
              <h3 className="stats-card-title">Completed Orders</h3>
              <div className="stats-card-value completed">{stats.completedOrders}</div>
            </div>

            <div className="stats-card">
              <h3 className="stats-card-title">Total Customers</h3>
              <div className="stats-card-value customers">{stats.totalCustomers}</div>
            </div>

            <div className="stats-card">
              <h3 className="stats-card-title">Total Dealers</h3>
              <div className="stats-card-value dealers">{stats.totalDealers}</div>
            </div>

            <div className="stats-card">
              <h3 className="stats-card-title">Total Products</h3>
              <div className="stats-card-value products">{stats.totalProducts}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
