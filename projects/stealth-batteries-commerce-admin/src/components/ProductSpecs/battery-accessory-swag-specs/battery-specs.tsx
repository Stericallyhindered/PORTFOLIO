'use client'

import { Battery, Bluetooth, Box, ThermometerSun, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UnitSwitch } from '@/components/UnitSwitch'
import { useState } from 'react'
import { GiFlame, GiLightningFlame } from 'react-icons/gi'
import { PiLightningSlashFill } from 'react-icons/pi'
import { FaChild, FaScrewdriverWrench } from 'react-icons/fa6'
import { TbCircuitBattery } from 'react-icons/tb'
import { Badge } from '@/components/ui/badge'
import { formatReleaseDate, isPreOrder, ProductSpecsProps } from './shared-functions'
import { DealerPrice } from '@/components/DealerPrice'
import { AddToCart } from '@/components/AddToCart'

// Helper to highlight 'V' and 'AH' in the product title
const wordsToHighlight = ['Battery', 'Kraken', 'Stealth', 'Live scope', 'Stryker']
function highlightWords(title: string, wordsToHighlight: string[]) {
  const regex = new RegExp(`(${wordsToHighlight.join('|')})`, 'gi')
  return title.replace(regex, (match) => `<span class="text-primary">${match}</span>`)
}

// Helper to highlight 'V' and 'AH' in the product title
function highlightUnits(title: string) {
  // Replace e.g. 12V and 100AH with colored units
  return title.replace(/(\d+)(V|AH)/g, (match, num, unit) => {
    return `${num}<span class=\"text-primary\">${unit}</span>`
  })
}

export const BatterySpecs: React.FC<ProductSpecsProps> = ({ product }) => {
  const [useMetric, setUseMetric] = useState(false)

  // Early return if no specifications
  if (!product.specifications) {
    return null
  }

  const specs = product.specifications // For cleaner code

  // Helper function to safely format dimensions
  const safeDimensions = specs.dimensions && {
    length: specs.dimensions.length ?? 0,
    width: specs.dimensions.width ?? 0,
    height: specs.dimensions.height ?? 0,
  }

  // Helper function to safely get voltage values
  const safeVoltage = specs.voltage &&
    product.productType === 'battery' && {
      displayedVoltage: specs.voltage.displayedVoltage ?? 12,
      standard: specs.voltage.standard ?? 0,
      charging: specs.voltage.charging ?? 0,
    }

  // Helper function to safely get current values
  const safeCurrent = specs.current && {
    maxChargingCurrent: specs.current.maxChargingCurrent ?? 0,
    maxContinuousDischarge: specs.current.maxContinuousDischarge ?? 0,
    coldCranking: specs.current.coldCranking ?? 0,
  }

  const formatDimensions = (length: number, width: number, height: number) => {
    if (useMetric) {
      // Convert inches to mm for metric display
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
    <div className="w-full py-6 z-10 my-10">
      {/* Product Details */}
      <div className="space-y-6">
        <Tabs defaultValue="description" className="w-full bg-black/70 rounded-lg ">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 bg-black/70 text-white">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="warnings">Warnings</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="rounded-none">
            <Card className="rounded-none bg-black/70 border-none">
              <CardContent className="grid gap-4 py-12 p-6">
                <p className="text-md text-foreground whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="specs" className="rounded-none">
            <Card className="rounded-none bg-black/70 border-none">
              <CardContent className="grid gap-4 p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Battery Type</p>
                    <p className="font-medium">{product.specifications.batteryType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-medium">
                      {product.specifications.ampHours}Ah / {product.specifications.wattHours}Wh
                    </p>
                  </div>
                  {specs.hasBluetoothConnectivity && (
                    <>
                      <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                        <Bluetooth className="h-6 w-6" />
                        <h3 className="font-semibold">Bluetooth Connectivity</h3>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="grid gap-6">
                  <h3 className="font-semibold flex items-center gap-2 tracking-wider">
                    <Zap className="h-4 w-4" />
                    Electrical Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-6">
                      {safeVoltage && (
                        <>
                          <span>Displayed Voltage</span>
                          <span>{safeVoltage.displayedVoltage}V</span>
                          <span>Standard Voltage</span>
                          <span>{safeVoltage.standard}V</span>
                          <span>Charging Voltage</span>
                          <span>{safeVoltage.charging}V</span>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      {safeCurrent && (
                        <>
                          <span>Max Charging Current</span>
                          <span>{safeCurrent.maxChargingCurrent}A</span>
                          <span>Max Continuous Discharge</span>
                          <span>{safeCurrent.maxContinuousDischarge}A</span>
                          <span>Cold Cranking Amps</span>
                          <span>{safeCurrent.coldCranking}A</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 place-items-center">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cycles</p>
                      <p className="font-medium">{product.specifications.cycles}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-4 w-4" />
                    <div>
                      <p className="text-sm text-muted-foreground">Max Temperature</p>
                      <p className="font-medium">
                        {product.specifications.maxTemperature || '140'}°F
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dimensions">
            <Card className="rounded-none bg-black/70 border-none">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  <div className="flex justify-between w-full">
                    <h3 className="font-semibold">Physical Specifications</h3>
                    <UnitSwitch isMetric={useMetric} onToggle={setUseMetric} />
                  </div>
                </div>
                {safeDimensions && (
                  <div className="grid grid-cols-2 gap-y-2 text-md">
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
                    {typeof specs.weight === 'number' && (
                      <>
                        <span>Weight</span>
                        <span>{formatWeight(specs.weight)}</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="warnings">
            <Card className="rounded-none bg-black/70 border-none">
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 text-md">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-500">Warning</h3>
                    <p className="flex items-center gap-2">
                      <TbCircuitBattery size={24} />
                      Do not short circuit
                    </p>
                    <p className="flex items-center gap-2">
                      <FaScrewdriverWrench size={24} />
                      Do not disassemble
                    </p>
                    <p className="flex items-center gap-2">
                      <GiFlame size={24} />
                      Do not incinerate
                    </p>
                    <p className="flex items-center gap-2">
                      <ThermometerSun size={24} />
                      Do not expose to temperatures above {product.specifications.maxTemperature}
                      °F
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-500">Dangers</h3>
                    <p className="flex items-center gap-2">
                      <GiLightningFlame size={24} />
                      Risk of fire or explosion
                    </p>
                    <p className="flex items-center gap-2">
                      <PiLightningSlashFill size={24} />
                      Avoid mechanical shock
                    </p>
                    <p className="flex items-center gap-2">
                      <FaChild size={24} />
                      Keep away from children
                    </p>
                    <p className="flex items-center gap-2">
                      <GiLightningFlame size={24} />
                      Only use lithium chargers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <div className="text-sm text-foreground text-center py-2">
            Designed in the <span className="font-bold text-primary">USA</span>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export const BatteryTitleColumn = ({ product }: ProductSpecsProps) => {
  // Get the hero image URL safely
  const heroImageUrl =
    typeof product.heroImage === 'object' && product.heroImage !== null
      ? product.heroImage.url || undefined
      : undefined

  const specs = product.specifications // For cleaner code
  if (!specs) {
    return null
  }

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
          <div className="flex flex-row gap-2">
            {specs.grade && (
              <Badge variant="default" className="text-white hover:bg-primary">
                Grade {specs.grade}
              </Badge>
            )}
            {specs.purpose && (
              <Badge variant="secondary" className="text-white hover:bg-secondary">
                {specs.purpose === 'dual'
                  ? 'Dual Purpose'
                  : specs.purpose === 'starting'
                    ? 'Starting'
                    : 'Deep Cycle'}
              </Badge>
            )}
          </div>
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
