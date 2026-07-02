'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Mail,
  Shield,
  TrendingUp,
  Target,
  Calendar,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface SalesRep {
  id: string
  name: string
  email: string
  role: string
  commissionRate: number
  targetQuota: number
  active: boolean
  createdAt: string
  updatedAt: string
}

const roleOptions = [
  { value: 'rep', label: 'Sales Representative' },
  { value: 'senior_rep', label: 'Senior Sales Representative' },
  { value: 'manager', label: 'Sales Manager' },
  { value: 'director', label: 'Sales Director' },
  { value: 'vp', label: 'Vice President of Sales' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Fetch sales rep data
  useEffect(() => {
    const fetchSalesRep = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/me`, {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            router.push('/sales-rep-login')
            return
          }
          throw new Error('Failed to fetch sales rep data')
        }

        const data = await response.json()
        if (!data.user) {
          router.push('/sales-rep-login')
          return
        }

        setSalesRep(data.user)
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          role: data.user.role || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } catch (error) {
        console.error('Error fetching sales rep:', error)
        toast.error('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesRep()
  }, [router])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!salesRep) return

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.newPassword && !formData.currentPassword) {
      toast.error('Current password is required to set a new password')
      return
    }

    setIsSaving(true)

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      // Only include password fields if changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.password = formData.newPassword
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/${salesRep.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors?.[0]?.message || 'Failed to update profile')
      }

      const updatedData = await response.json()
      setSalesRep(updatedData.doc)
      setIsEditing(false)

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))

      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (!salesRep) return

    setFormData({
      name: salesRep.name || '',
      email: salesRep.email || '',
      role: salesRep.role || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!salesRep) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  const getRoleLabel = (role: string) => {
    return roleOptions.find((option) => option.value === role)?.label || role
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences.</p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={salesRep.active ? 'default' : 'secondary'}>
                {salesRep.active ? 'Active' : 'Inactive'}
              </Badge>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="sm" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md">{salesRep.name}</div>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                  />
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md">{salesRep.email}</div>
                )}
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                {isEditing ? (
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md">{getRoleLabel(salesRep.role)}</div>
                )}
              </div>
            </div>

            {/* Sales Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <div className="p-2 bg-muted/50 rounded-md">{salesRep.commissionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Commission rate is set by administrators
                </p>
              </div>

              <div>
                <Label htmlFor="targetQuota">Target Quota ($)</Label>
                <div className="p-2 bg-muted/50 rounded-md">
                  ${salesRep.targetQuota.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target quota is set by administrators
                </p>
              </div>

              <div>
                <Label>Member Since</Label>
                <div className="p-2 bg-muted/50 rounded-md">
                  {new Date(salesRep.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Leave password fields empty if you don&apos;t want to change your password.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesRep.commissionRate}%</div>
            <p className="text-xs text-muted-foreground">On all sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Quota</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesRep.targetQuota.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesRep.active ? 'Active' : 'Inactive'}</div>
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(salesRep.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
