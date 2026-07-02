import { AddToCart } from '@/components/AddToCart'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { Product } from '@/payload-types'
import Link from 'next/link'
import { useDealer } from '@/hooks/useDealer'
import { getDealerProductPrice } from '@/utilities/getDealerProductPrice'

interface AccessorySpecsProps {
  product: Product
}

const IsAccessorySpecs = ({ product }: AccessorySpecsProps) => {
  const { dealer } = useDealer()
  const isDealer = dealer && dealer.verified
  const price = product.price
  const dealerPrice = typeof product.dealerPrice === 'number' ? product.dealerPrice : undefined
  const priceToShow = getDealerProductPrice({
    product: { id: String(product.id), price, dealerPrice },
    dealer: isDealer ? (dealer as any) : undefined,
  })

  const accessoryDetails = product.accessoryDetails
  return (
    <div className="grid md:grid-cols-2 gap-8 py-12 md:py-4 md:p-8 max-h-screen overflow-y-auto w-full overflow-x-hidden">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight font-apotek-extended">
            <span className="text-primary">{product.title}</span>
          </h2>
        </div>

        <div className="relative min-h-[500px] max-h-[700px] h-auto w-full bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
          {product.heroImage && typeof product.heroImage !== 'string' && (
            <div className="relative h-auto max-h-[700px] w-auto">
              <Media
                resource={product.heroImage}
                className="object-contain w-auto h-auto max-w-full max-h-[700px]"
                size="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 sticky top-0 bg-black z-10">
          <h3 className="text-2xl font-bold font-apotek-extended">Accessory Details</h3>
        </div>

        <div className="grid gap-6">
          {product.modelNumber && (
            <div className="bg-white/10 p-5 rounded-lg">
              <div className="text-primary text-2xl font-bold font-apotek-extended">
                {product.modelNumber}
              </div>
              <div className="text-sm text-white/70 font-apotek-extended">Model Number</div>
            </div>
          )}
          <>
            {accessoryDetails?.compatibility && (
              <div className="bg-white/10 p-5 rounded-lg">
                <div className="text-primary text-2xl font-bold font-apotek-extended">
                  {accessoryDetails.compatibility}
                </div>
                <div className="text-sm text-white/70 font-apotek-extended">Compatible With</div>
              </div>
            )}
            {accessoryDetails?.dimensions &&
              (accessoryDetails.dimensions.length ||
                accessoryDetails.dimensions.width ||
                accessoryDetails.dimensions.height) && (
                <div className="bg-white/10 p-5 rounded-lg">
                  <div className="text-primary text-2xl font-bold font-apotek-extended">
                    {`${accessoryDetails.dimensions.length || '-'}L x ${accessoryDetails.dimensions.width || '-'}W x ${accessoryDetails.dimensions.height || '-'}H`}
                  </div>
                  <div className="text-sm text-white/70 font-apotek-extended">Dimensions</div>
                </div>
              )}
            {accessoryDetails?.specifications && (
              <div className="bg-white/10 p-5 rounded-lg">
                <div className="text-primary text-2xl font-bold font-apotek-extended whitespace-pre-wrap">
                  {accessoryDetails.specifications}
                </div>
                <div className="text-sm text-white/70 font-apotek-extended">Specifications</div>
              </div>
            )}
            {accessoryDetails?.weight && (
              <div className="bg-white/10 p-5 rounded-lg">
                <div className="text-primary text-2xl font-bold font-apotek-extended">
                  {accessoryDetails.weight} lbs
                </div>
                <div className="text-sm text-white/70 font-apotek-extended">Weight</div>
              </div>
            )}
          </>

          <div className="bg-white/10 p-5 rounded-lg">
            <div className="text-primary text-2xl font-bold font-apotek-extended">
              ${priceToShow.toFixed(2)}
            </div>
            <div className="text-sm text-white/70 font-apotek-extended">Price</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-evenly gap-4">
          <div className="h-[60px] w-fit">
            <AddToCart
              product={{
                id: String(product.id || product.slug || ''),
                title: product.title,
                price: priceToShow,
                image:
                  product.heroImage &&
                  typeof product.heroImage === 'object' &&
                  'url' in product.heroImage &&
                  product.heroImage.url
                    ? product.heroImage.url
                    : undefined,
                inventory: product.inventory,
                releaseDate: product.releaseDate,
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
          <Button
            asChild
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-0 text-white text-lg self-center self-justify-center w-fit font-apotek-extended"
          >
            <Link href={`/products/${product.slug}`}>More Details</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default IsAccessorySpecs
