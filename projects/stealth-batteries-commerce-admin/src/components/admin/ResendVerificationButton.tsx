'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Dealer } from '@/payload-types'

type DocumentInfo = {
  id?: string
  docConfig?: {
    slug: string
  }
  document?: Dealer
}

export default function ResendVerificationButton() {
  const { id, docConfig, document: doc } = useDocumentInfo() as DocumentInfo
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null)
  const [isLoadingVerificationStatus, setIsLoadingVerificationStatus] = useState(true)

  // Fetch dealer data directly to get the _verified field
  useEffect(() => {
    const fetchDealerData = async () => {
      if (!id || !docConfig?.slug) {
        setIsLoadingVerificationStatus(false)
        return
      }

      try {
        const response = await fetch(`/api/${docConfig.slug}/${id}`, {
          credentials: 'include',
        })

        if (response.ok) {
          const dealerData = await response.json()
          setIsEmailVerified(dealerData._verified === true)
        } else {
          console.error('Failed to fetch dealer data for verification status')
          // Fallback to the document from useDocumentInfo
          setIsEmailVerified(doc?._verified === true)
        }
      } catch (error) {
        console.error('Error fetching dealer verification status:', error)
        // Fallback to the document from useDocumentInfo
        setIsEmailVerified(doc?._verified === true)
      } finally {
        setIsLoadingVerificationStatus(false)
      }
    }

    fetchDealerData()
  }, [id, docConfig?.slug, doc?._verified])

  const handleResendVerification = async () => {
    if (!id || !docConfig?.slug) {
      console.error('No document ID or collection slug available')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/${docConfig.slug}/${id}/resend-verification`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.errors?.[0]?.message || 'Failed to resend verification email')
        return
      }

      toast.success('Verification email sent successfully')
    } catch (error) {
      console.error('Error resending verification email:', error)
      toast.error('An error occurred while sending the verification email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingVerificationStatus) {
    return (
      <div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Email Verification Status</strong>
        </div>
        <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
          Loading verification status...
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Email Verification Status</strong>
      </div>
      <div
        style={{
          marginBottom: '10px',
          fontSize: '0.9em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {isEmailVerified ? (
          <>
            <CheckCircle2 style={{ color: '#16a34a' }} size={16} />
            <span style={{ color: '#16a34a', fontWeight: '500' }}>Email verified</span>
          </>
        ) : (
          <>
            <XCircle style={{ color: '#dc2626' }} size={16} />
            <span style={{ color: '#dc2626', fontWeight: '500' }}>Email not verified</span>
          </>
        )}
      </div>
      {!isEmailVerified && (
        <>
          <div style={{ marginBottom: '10px', fontSize: '0.8em', color: '#666' }}>
            Send or resend the verification email to this dealer
          </div>
          <Button
            onClick={handleResendVerification}
            disabled={isLoading || !id || !docConfig?.slug}
            variant="secondary"
            size="sm"
          >
            {isLoading ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </>
      )}
    </div>
  )
}
