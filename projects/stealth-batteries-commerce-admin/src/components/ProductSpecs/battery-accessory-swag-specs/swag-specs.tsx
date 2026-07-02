'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddToCart } from '@/components/AddToCart'
import { DealerPrice } from '@/components/DealerPrice'
import { formatReleaseDate, isPreOrder, ProductSpecsProps } from './shared-functions'

export const SwagSpecs: React.FC<ProductSpecsProps> = ({ product }) => {
  // Get the hero image URL safely
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
                  <p className="text-md text-foreground whitespace-pre-wrap font-noto">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="specs" className="rounded-none">
              <Card className="rounded-none bg-black/70 border-none">
                <CardContent className="space-y-4 p-6">
                  {product.swagDetails && (
                    <>
                      {product.swagDetails.material && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Material</p>
                          <p className="font-medium">{product.swagDetails.material}</p>
                        </div>
                      )}
                      {product.swagDetails.careInstructions && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Care Instructions</p>
                          <p className="font-medium">{product.swagDetails.careInstructions}</p>
                        </div>
                      )}
                      {product.swagDetails.fit && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Fit</p>
                          <p className="font-medium">
                            {product.swagDetails.fit.charAt(0).toUpperCase() +
                              product.swagDetails.fit.slice(1)}
                          </p>
                        </div>
                      )}
                      {product.swagDetails.dimensions && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Dimensions</p>
                          <p className="font-medium">
                            {product.swagDetails.dimensions.width}&quot; ×{' '}
                            {product.swagDetails.dimensions.height}&quot;
                          </p>
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

export const SwagTitleColumn = ({ product }: ProductSpecsProps) => {
  const heroImageUrl =
    typeof product.heroImage === 'object' && product.heroImage !== null
      ? product.heroImage.url || undefined
      : undefined

  return (
    <div className="flex flex-col items-center lg:items-start lg:px-8 gap-8 mb-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold font-apotek-extended">{product.title}</h1>
        </div>
        <div className="flex flex-col xl:flex-row gap-2">
          {product.swagType && (
            <Badge variant="secondary">
              {product.swagType.charAt(0).toUpperCase() + product.swagType.slice(1)}
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
