'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Shield, Loader2 } from 'lucide-react'

interface RoleManagementDialogProps {
  userId: string
  userName: string
  currentRole: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleUpdated?: () => void
}

const roleOptions = [
  { value: 'member', label: 'Member', description: 'Regular user access' },
  { value: 'bass-clown-admin', label: 'Admin', description: 'Full admin access' },
  { value: 'brand', label: 'Brand', description: 'Brand user access' },
  { value: 'brand-admin', label: 'Brand Admin', description: 'Brand admin access' },
  { value: 'guest', label: 'Guest', description: 'Limited guest access' },
]

export function RoleManagementDialog({
  userId,
  userName,
  currentRole,
  open,
  onOpenChange,
  onRoleUpdated,
}: RoleManagementDialogProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (selectedRole === currentRole) {
      onOpenChange(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role')
      }

      toast({
        title: 'Role updated',
        description: `${userName}'s role has been updated to ${roleOptions.find(r => r.value === selectedRole)?.label}.`,
      })

      onOpenChange(false)
      if (onRoleUpdated) {
        onRoleUpdated()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user role',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage User Role
          </DialogTitle>
          <DialogDescription>
            Change the role for <strong>{userName}</strong>. This will affect their access permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span>{role.label}</span>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRole === 'bass-clown-admin' && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
              <strong>Admin Access:</strong> This user will have full access to all admin features including user management, contests, giveaways, and system settings.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || selectedRole === currentRole}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}






