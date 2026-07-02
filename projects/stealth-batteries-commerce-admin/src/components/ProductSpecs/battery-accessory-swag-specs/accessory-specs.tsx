'use client'

import { Box } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UnitSwitch } from '@/components/UnitSwitch'
import { useState } from 'react'
import { AddToCart } from '@/components/AddToCart'
import { DealerPrice } from '@/components/DealerPrice'
import { formatReleaseDate, isPreOrder, ProductSpecsProps } from './shared-functions'

// Helper to highlight 'V' and 'AH' in the product title
const wordsToHighlight = ['Stealth', 'Lithium', 'Shot', 'Tray', 'Charger']
function highlightWords(title: string, wordsToHighlight: string[]) {
  const regex = new RegExp(`(${wordsToHighlight.join('|')})`, 'gi')
  return title.replace(regex, (match) => `<span class="text-primary">${match}</span>`)
}

function highlightUnits(title: string) {
  // Replace e.g. 12V and 100AH with colored units, case-insensitive
  return title.replace(/(\d+)(V|AH)/gi, (match, num, unit) => {
    return `${num}<span class="text-primary">${unit}</span>`
  })
}

// Accessory product display component
export const AccessorySpecs: React.FC<ProductSpecsProps> = ({ product }) => {
  const [useMetric, setUseMetric] = useState(false)

  const accessoryDetails = product.accessoryDetails
  // Helper function to safely format dimensions
  const safeDimensions = accessoryDetails?.dimensions && {
    length: accessoryDetails.dimensions.length ?? 0,
    width: accessoryDetails.dimensions.width ?? 0,
    height: accessoryDetails.dimensions.height ?? 0,
  }

  const formatDimensions = (length: number, width: number, height: number) => {
    if (useMetric) {
      // Convert inches to mm
      return `${(length * 25.4).toFixed(1)} mm × ${(width * 25.4).toFixed(1)} mm × ${(height * 25.4).toFixed(1)} mm`
    }
    // Use original imperial values
    return `${length.toFixed(1)} in × ${width.toFixed(1)} in × ${height.toFixed(1)} in`
  }

  const formatWeight = (weight: number) => {
    if (useMetric) {
      // Convert lbs to kg and force 2 decimal places for metric
      return `${(weight / 2.20462).toFixed(2)} kg`
    }
    // Use original imperial values with 1 decimal place
    return `${weight.toFixed(1)} lbs`
  }

  return (
    <div className="w-full py-6 z-10">
      <div className="grid gap-8">
        <div className="space-y-6">
          <Tabs defaultValue="description" className="w-full bg-black/70 rounded-lg ">
            <TabsList className="grid grid-cols-2 bg-black/70 text-white">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="rounded-none">
              <Card className="rounded-none bg-black/70 border-none">
                <CardContent className="grid gap-4 py-12 p-6">
                  <p className="text-md text-foreground whitespace-pre-wrap">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="specs" className="rounded-none">
              <Card className="rounded-none bg-black/70 border-none">
                <CardContent className="space-y-4 p-6">
                  {accessoryDetails && (
                    <>
                      {accessoryDetails.compatibility && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Compatible With</p>
                          <p className="font-medium">{accessoryDetails.compatibility}</p>
                        </div>
                      )}
                      {accessoryDetails.specifications && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Specifications</p>
                          <p className="font-medium whitespace-pre-wrap">
                            {accessoryDetails.specifications}
                          </p>
                        </div>
                      )}
                      {safeDimensions &&
                        Object.values(safeDimensions).some((value) => value > 0) && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Box className="h-4 w-4" />
                                <h3 className="font-semibold">Physical Specifications</h3>
                              </div>
                              <UnitSwitch isMetric={useMetric} onToggle={setUseMetric} />
                            </div>
                            {safeDimensions && (
                              <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <span>Length</span>
                                <span>
                                  {formatDimensions(
                                    safeDimensions.length,
                                    safeDimensions.width,
                                    safeDimensions.height,
                                  )
                                    .split('×')[0]
                                    .trim()}
                                </span>
                                <span>Width</span>
                                <span>
                                  {formatDimensions(
                                    safeDimensions.length,
                                    safeDimensions.width,
                                    safeDimensions.height,
                                  )
                                    .split('×')[1]
                                    .trim()}
                                </span>
                                <span>Height</span>
                                <span>
                                  {formatDimensions(
                                    safeDimensions.length,
                                    safeDimensions.width,
                                    safeDimensions.height,
                                  )
                                    .split('×')[2]
                                    .trim()}
                                </span>
                                {accessoryDetails.weight && (
                                  <>
                                    <span>Weight</span>
                                    <span>{formatWeight(accessoryDetails.weight)}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export const AccessoryTitleColumn = ({ product }: ProductSpecsProps) => {
  // Get the hero image URL safely
  const heroImageUrl =
    typeof product.heroImage === 'object' && product.heroImage !== null
      ? product.heroImage.url || undefined
      : undefined
  const accessoryDetails = product.accessoryDetails
  return (
    <div className="flex flex-col items-center lg:items-start lg:px-8 gap-8 mb-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-2">
          <h1
            className="text-3xl font-bold font-apotek-extended"
            dangerouslySetInnerHTML={{
              __html: highlightUnits(highlightWords(product.title, wordsToHighlight)),
            }}
          />
        </div>
        <div className="flex flex-col xl:flex-row gap-2">
          {accessoryDetails?.accessoryType && (
            <Badge variant="secondary">
              {accessoryDetails.accessoryType.charAt(0).toUpperCase() +
                accessoryDetails.accessoryType.slice(1)}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-col xl:flex-row font-noto justify-between items-center w-full">
        <div className="flex md:flex-row items-center gap-4">
          <DealerPrice
            price={product.price}
            dealerPrice={product.dealerPrice}
            className="text-xl"
            showRegularPrice={true}
            productId={product.id}
          />
          <p className="text-sm text-muted-foreground">
            {isPreOrder(product.releaseDate)
              ? 'Pre-order'
              : product.inventory?.trackInventory && product.inventory.quantity === 0
                ? 'Out of Stock'
                : product.inventory?.trackInventory &&
                    product.inventory.lowStockThreshold &&
                    product.inventory.quantity <= product.inventory.lowStockThreshold
                  ? 'Low Stock'
                  : 'In Stock'}
          </p>
        </div>
        <div className="flex justify-between gap-2">
          <AddToCart
            product={{
              id: product.id.toString(),
              title: product.title,
              price: product.price,
              image: heroImageUrl,
              releaseDate: product.releaseDate,
              inventory: product.inventory,
              shippingDetails: {
                weight: product.shippingDetails.weight,
                length: product.shippingDetails.length,
                width: product.shippingDetails.width,
                height: product.shippingDetails.height,
                stackable: product.shippingDetails.stackable || undefined,
                hazmat: product.shippingDetails.hazmat || undefined,
                freightClass: product.shippingDetails.freightClass || undefined,
                requiresLiftgate: product.shippingDetails.requiresLiftgate || undefined,
              },
            }}
          />
        </div>
      </div>
      {isPreOrder(product.releaseDate) ? (
        <p className="text-primary text-center text-sm mt-2 w-full">
          Available {formatReleaseDate(product.releaseDate!)} - pre-order now to reserve yours!
        </p>
      ) : (
        product.inventory?.trackInventory &&
        product.inventory.quantity === 0 && (
          <p className="text-primary text-center text-sm mt-2 w-full">
            Out of Stock items typically ship in 3-4 weeks - order now and we&apos;ll ship as soon
            as they&apos;re back in stock!
          </p>
        )
      )}
    </div>
  )
}
