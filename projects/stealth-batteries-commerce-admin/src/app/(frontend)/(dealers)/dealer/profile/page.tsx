'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { validateFullAddress } from '@/lib/address-validation'
import { AddressValidationDisplay } from '@/components/AddressValidationDisplay'
import type { AddressValidationResult } from '@/lib/address-validation'
import { US_STATES } from '@/lib/constants/us-states'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const profileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  address: z.object({
    line1: z.string().min(1, 'Street address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(5, 'ZIP code must be at least 5 characters'),
  }),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const taxExemptSchema = z.object({
  type: z.enum(['exemption', 'other'], {
    required_error: 'Please select a document type',
  }),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>
type TaxExemptFormValues = z.infer<typeof taxExemptSchema>

export default function DealerProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [dealerId, setDealerId] = useState<number | null>(null)
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null)
  const [taxExemptStatus, setTaxExemptStatus] = useState<
    'none' | 'pending' | 'approved' | 'rejected'
  >('none')
  const [taxExemptDocuments, setTaxExemptDocuments] = useState<
    Array<{
      id: string
      type: 'exemption' | 'other'
      expirationDate?: string | null
      notes?: string | null
      document: { url: string; filename: string }
    }>
  >([])

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      phoneNumber: '',
      email: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip: '',
      },
    },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const taxExemptForm = useForm<TaxExemptFormValues>({
    resolver: zodResolver(taxExemptSchema),
    defaultValues: {
      type: 'exemption',
      expirationDate: '',
      notes: '',
    },
  })

  // Validate address on form submission instead of on every change
  const validateAddress = useCallback(() => {
    const formValues = form.getValues()
    const address = formValues.address
    if (address.line1 || address.city || address.state || address.zip) {
      const validation = validateFullAddress({
        line1: address.line1 || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.zip || '',
      })
      setAddressValidation(validation)
      return validation
    } else {
      setAddressValidation(null)
      return null
    }
  }, [form])

  // Apply suggested address values
  const handleApplySuggestions = useCallback(
    (suggestions: { street?: string; city?: string; state?: string; zip?: string }) => {
      if (suggestions.street) form.setValue('address.line1', suggestions.street)
      if (suggestions.city) form.setValue('address.city', suggestions.city)
      if (suggestions.state) form.setValue('address.state', suggestions.state)
      if (suggestions.zip) form.setValue('address.zip', suggestions.zip)
    },
    [form],
  )

  useEffect(() => {
    // Fetch current dealer profile
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/dealers/me', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()
        setDealerId(data.user.id)
        setTaxExemptStatus(data.user.taxExemptStatus || 'none')
        setTaxExemptDocuments(data.user.taxExemptDocuments || [])

        // Set form values
        form.reset({
          companyName: data.user.companyName,
          contactName: data.user.contactName,
          phoneNumber: data.user.phoneNumber,
          email: data.user.email,
          address: {
            line1: data.user.address.line1 || '',
            line2: data.user.address.line2 || '',
            city: data.user.address.city || '',
            state: data.user.address.state || '',
            zip: data.user.address.zip || '',
          },
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      }
    }

    fetchProfile()
  }, [form])

  async function onSubmit(data: ProfileFormValues) {
    // Validate address before submission
    const validation = validateAddress()
    if (validation && !validation.isValid) {
      toast.error('Please correct the address errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/dealers/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!dealerId) {
      toast.error('Unable to update password. Please try again later.')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/${dealerId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: data.newPassword,
          }),
          credentials: 'include',
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || errorData.errors?.[0]?.message || 'Failed to update password',
        )
      }

      toast.success('Password updated successfully')
      passwordForm.reset()
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function onTaxExemptSubmit(data: TaxExemptFormValues) {
    if (!dealerId) {
      toast.error('Unable to submit tax exemption. Please try again later.')
      return
    }

    const fileInput = document.querySelector<HTMLInputElement>('#taxExemptDocument')
    const file = fileInput?.files?.[0]

    if (!file) {
      toast.error('Please select a document to upload')
      return
    }

    setIsUploadingDocument(true)
    try {
      // First, upload the file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'tax-exemption')

      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/media?documentType=tax-exemption`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        },
      )

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document')
      }

      const uploadData = await uploadResponse.json()

      // Then update the dealer with the new document
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/${dealerId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taxExemptDocuments: [
              ...taxExemptDocuments.map((doc) => ({
                document: doc.document.url ? { id: doc.id } : doc.document,
                type: doc.type,
                expirationDate: doc.expirationDate,
                notes: doc.notes,
              })),
              {
                document: { id: uploadData.doc.id },
                type: data.type,
                expirationDate: data.expirationDate || null,
                notes: data.notes || null,
              },
            ],
            taxExemptStatus: 'pending',
          }),
          credentials: 'include',
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message ||
            errorData.errors?.[0]?.message ||
            'Failed to update tax exempt status',
        )
      }

      // Update local state with the full document info for display
      setTaxExemptStatus('pending')
      setTaxExemptDocuments([
        ...taxExemptDocuments,
        {
          id: uploadData.doc.id,
          type: data.type,
          expirationDate: data.expirationDate || null,
          notes: data.notes || null,
          document: { url: uploadData.doc.url, filename: file.name },
        },
      ])

      toast.success('Tax exemption document submitted successfully')
      taxExemptForm.reset()
      if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Error submitting tax exemption:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit tax exemption')
    } finally {
      setIsUploadingDocument(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            Pending Review
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            Not Requested
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 container mx-auto my-12 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your dealer profile information</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your company and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address.line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address.line2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {US_STATES.map((state) => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address.zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={10} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Address Validation */}
                  <div className="mt-4 space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => validateAddress()}
                    >
                      Validate Address
                    </Button>
                    {addressValidation && (
                      <AddressValidationDisplay
                        validation={addressValidation}
                        onApplySuggestions={handleApplySuggestions}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tax Exemption</CardTitle>
                <CardDescription>Submit tax exemption documentation for review</CardDescription>
              </div>
              {getStatusBadge(taxExemptStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {taxExemptDocuments.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Submitted Documents</h4>
                  <div className="space-y-2">
                    {taxExemptDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div>
                          <p className="font-medium">{doc.document.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            Type: {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                            {doc.expirationDate &&
                              ` • Expires: ${new Date(doc.expirationDate).toLocaleDateString()}`}
                          </p>
                          {doc.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>
                          )}
                        </div>
                        <a
                          href={doc.document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {taxExemptStatus !== 'approved' && (
                <Form {...taxExemptForm}>
                  <form
                    onSubmit={taxExemptForm.handleSubmit(onTaxExemptSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={taxExemptForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Document Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || 'exemption'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="exemption">Tax Exemption Certificate</SelectItem>
                                <SelectItem value="other">Other Documentation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxExemptForm.control}
                        name="expirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          control={taxExemptForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add any additional information about your tax exemption status"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <FormItem>
                          <FormLabel>Upload Document</FormLabel>
                          <FormControl>
                            <Input
                              id="taxExemptDocument"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </FormControl>
                          <FormDescription>
                            Upload your tax exemption certificate or related documentation (PDF,
                            Word, or image files)
                          </FormDescription>
                        </FormItem>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUploadingDocument}>
                        {isUploadingDocument ? 'Uploading...' : 'Submit for Review'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {taxExemptStatus === 'approved' && (
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">
                    Your tax exemption status has been approved. You will not be charged sales tax
                    on your orders.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
