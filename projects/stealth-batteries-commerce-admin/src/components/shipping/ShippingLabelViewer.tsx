'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Printer, ChevronLeft, ChevronRight, Download } from 'lucide-react'

interface ShippingLabelViewerProps {
  labels: string[]
  onClose?: () => void
}

export function ShippingLabelViewer({ labels, onClose }: ShippingLabelViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Add print-optimized CSS
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Labels</title>
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .label-container {
              width: 100%;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              page-break-after: always;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              transform: rotate(90deg);
            }
            @media print {
              .label-container {
                height: 100%;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
    `)

    // Add each label as a separate page
    labels.forEach((label) => {
      printWindow.document.write(`
        <div class="label-container">
          <img src="${label}" alt="Shipping Label" />
        </div>
      `)
    })

    printWindow.document.write('</body></html>')
    printWindow.document.close()

    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print()
      // Close the window after printing (optional)
      // printWindow.close()
    }, 250)
  }

  const handleDownload = () => {
    // Create a zip file if multiple labels, or download single label directly
    if (labels.length === 1) {
      const link = document.createElement('a')
      link.href = labels[0]
      link.download = 'shipping-label.gif'
      link.click()
    } else {
      // For multiple labels, download each one with a numbered filename
      labels.forEach((label, index) => {
        const link = document.createElement('a')
        link.href = label
        link.download = `shipping-label-${index + 1}.gif`
        link.click()
      })
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

      {/* Viewer */}
      <Card className="fixed inset-4 z-[101] flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Shipping Label {currentIndex + 1} of {labels.length}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {labels.length > 1 ? 'Print All' : 'Print'}
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800">
          {/* Label display with rotation for landscape orientation */}
          <div className="min-h-full w-full p-4">
            <div className="sticky top-0 h-[calc(100vh-8rem)] w-full flex items-center justify-center">
              <img
                src={labels[currentIndex]}
                alt={`Shipping Label ${currentIndex + 1}`}
                className="w-auto h-[58%] object-contain object-top transform rotate-90"
              />
            </div>
          </div>
          {/* Navigation buttons */}
          {labels.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="fixed left-8 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : labels.length - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="fixed right-8 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={() => setCurrentIndex((prev) => (prev < labels.length - 1 ? prev + 1 : 0))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </Card>
    </>
  )
}
