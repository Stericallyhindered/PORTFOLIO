import { AddToCart } from '@/components/AddToCart'
import BatteryOutline from '@/components/icons/BatteryOutline'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Product } from '@/payload-types'
import Image from 'next/image'
import Link from 'next/link'
import { useDealer } from '@/hooks/useDealer'
import { getDealerProductPrice } from '@/utilities/getDealerProductPrice'

interface BatterySpecsProps {
  product: Product
}

const IsBatterySpecs = ({ product }: BatterySpecsProps) => {
  const { dealer } = useDealer()
  const isDealer = dealer && dealer.verified
  const price = product.price
  const dealerPrice = typeof product.dealerPrice === 'number' ? product.dealerPrice : undefined
  const priceToShow = getDealerProductPrice({
    product: { id: String(product.id), price, dealerPrice },
    dealer: isDealer ? (dealer as any) : undefined,
  })

  const dimensions = product.specifications?.dimensions
  const length = dimensions?.length
  const width = dimensions?.width
  const height = dimensions?.height
  const metricLength = length ? length * 25.4 : 0
  const metricWidth = width ? width * 25.4 : 0
  const metricHeight = height ? height * 25.4 : 0

  const purpose = {
    deepCycle: 'Deep Cycle',
    dual: 'Dual Purpose',
    starting: 'Starting',
    coldCrank: 'Cold Crank',
  }

  return (
    <div className="overscroll-y-contain h-full overflow-x-hidden">
      <div className="grid lg:grid-cols-11 gap-2">
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-6 p-4">
            <Link href={`/products/${product.slug}`}>
              <h2 className="text-4xl lg:text-6xl font-bold font-apotek-extended uppercase text-center md:text-left">
                {product.title}
              </h2>
            </Link>
            <div className="text-5xl text-primary font-apotek-extended italic font-bold md:min-h-[28px]">
              ${priceToShow.toFixed(2)}
            </div>
            <div className="text-sm text-white font-noto font-semibold w-full lg:w-9/12 min-h-[120px]">
              {product.description ? (
                product.description && product.description.length > 450 ? (
                  `${product.description.slice(0, 450)}...`
                ) : (
                  product.description
                )
              ) : (
                <p className="text-center">
                  One of our many top of the line Lithium Marine Grade Batteries
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Battery Mascot Image */}
        <div className="lg:col-span-4 w-10/12 place-self-center">
          <div className="md:w-[480px] md:h-[480px] lg:w-[373px] lg:h-[373px] place-self-center">
            {product.batteryMascot && typeof product.batteryMascot !== 'string' ? (
              <Media resource={product.batteryMascot} size="33vw" className="object-contain " />
            ) : (
              <Image
                src="/assets/PNG/strykerfish-with-dots.png"
                className="w-auto h-auto object-cover place-self-center"
                alt={product.title}
                width={750}
                height={750}
              />
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-0 bg-black py-2">
        <div className="relative lg:col-start-5 lg:col-span-6">
          <div className="col-start-1 lg:absolute lg:inset-0 lg:w-fit lg:-translate-y-full lg:translate-x-[55%]">
            {product.specifications?.hasBluetoothConnectivity && (
              <div className="flex flex-col items-center w-full gap-0">
                <div className="">
                  <Image
                    src="/assets/PNG/Screenshot 2025-02-14 at 12.07.38 PM.png"
                    alt="Bluetooth Connectivity"
                    width={50}
                    height={50}
                  />
                </div>
                <p className="text-xs text-white font-apotek-extended">Bluetooth Connectivity</p>
              </div>
            )}
          </div>
          <h3 className="text-[32px] md:text-[40px] font-apotek-extended uppercase text-center text-primary font-thin">
            Battery Specifications
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-9 gap-0 bg-primary">
        <div className="relative grid grid-rows-1 h-auto gap-6 md:col-span-4 lg:col-span-5">
          {product.heroImage && typeof product.heroImage !== 'string' && (
            <div className="relative lg:absolute inset-0 lg:w-11/12 h-full">
              <Media
                resource={product.heroImage}
                className="object-contain w-auto h-auto max-h-[360px] max-w-[640px] lg:-translate-y-1/3"
                size="(max-width: 400px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-0 md:col-span-5 lg:col-span-4 py-4 pr-2">
          <div className="grid grid-cols-1 px-4 md:px-0 md:grid-cols-5 gap-8 bg-primary">
            <div className="flex flex-col items-center justify-between md:col-span-2 md:items-start">
              <h4 className="text-lg font-bold font-apotek-extended text-white font-light">
                {product.specifications?.batteryType}
              </h4>
              <div className="flex flex-row gap-2 items-center">
                <div className="border-2 border-white p-2 w-fit h-fit">
                  <p className="text-xl text-white font-apotek-extended">
                    <span className="font-bold tracking-widest">
                      {product.specifications?.ampHours}Ah
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-0 h-fit">
                  <p className="text-xl text-white font-apotek-extended">
                    <span className="font-bold">
                      {product.specifications?.voltage?.displayedVoltage ?? 12}V
                    </span>
                  </p>
                </div>
              </div>
              <div className="relative -translate-x-full md:translate-x-0">
                <BatteryOutline className="text-white fill-white" width={50} height={50} />
                <div className="absolute top-0 left-0 flex flex-row gap-2 h-fit translate-x-[5%] translate-y-[45%]">
                  <h3 className="relative text-xl text-white font-apotek-extended uppercase font-thin">
                    Energy:
                  </h3>
                  <p className="text-lg text-white font-apotek-extended font-thin">
                    {product.specifications?.wattHours}Wh
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-0">
                <h4 className="text-sm text-white font-apotek-extended uppercase tracking-wider">
                  Specifications:
                </h4>
                <p className="text-xs text-white font-noto font-semibold">
                  Charging Voltage: {product.specifications?.voltage?.charging}V
                </p>
                <p className="text-xs text-white font-noto font-semibold">
                  Charging Current: {product.specifications?.voltage?.standard}A
                </p>
                <p className="text-xs text-white font-noto font-semibold">
                  Charging Current: {product.specifications?.current?.maxChargingCurrent}A
                </p>
                <p className="text-xs text-white font-noto font-semibold">
                  Discharge Current: {product.specifications?.current?.maxContinuousDischarge}A
                </p>
              </div>
            </div>
            <div className="md:col-span-3">
              <div className="space-y-4 w-full text-center md:text-left">
                <div className="space-y-1 text-[10px] w-full ">
                  <div className="flex flex-col gap-0 w-full tracking-wider font-noto font-semibold">
                    <h3 className="font-semibold text-white font-apotek-extended uppercase tracking-wider">
                      Do Not:
                    </h3>
                    <p className="uppercase text-xs">short circuit</p>
                    <p className="uppercase text-xs">disassemble</p>
                    <p className="uppercase text-xs">incinerate</p>
                    <p className="uppercase text-xs">
                      expose to temperatures above {product.specifications?.maxTemperature}
                      °F
                    </p>
                  </div>
                  <Separator className="bg-transparent" />
                  <div className="flex flex-col gap-0 w-full tracking-wider font-noto font-semibold">
                    <h3 className="font-semibold text-white font-apotek-extended uppercase tracking-wider">
                      Warning:
                    </h3>
                    <p className="uppercase text-xs">Risk of fire or explosion</p>
                    <p className="uppercase text-xs">Avoid mechanical shock</p>
                    <p className="uppercase text-xs">Keep away from children</p>
                    <p className="uppercase text-xs">Only use lithium chargers</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full justify-center items-center md:items-start">
                  <p className="flex flex-row gap-2 text-xs text-white font-apotek-extended w-fit text-center md:text-left">
                    <span className="font-bold uppercase tracking-wider">Weight:</span>{' '}
                    <span className="text-white font-noto font-semibold">
                      {product.specifications?.weight} lbs{' '}
                    </span>
                    <span className="text-white font-noto font-semibold">
                      (
                      {product.specifications?.weight
                        ? (product.specifications.weight * 0.45359237).toFixed(2)
                        : 0}{' '}
                      kg)
                    </span>
                  </p>
                  <p className="flex flex-col md:flex-row flex-wrap gap-2 text-xs text-white font-noto font-semibold">
                    <span className="font-bold uppercase font-apotek-extended tracking-wider">
                      Dimensions:
                    </span>{' '}
                    {product.specifications?.dimensions?.length}Lx
                    {product.specifications?.dimensions?.width}Wx
                    {product.specifications?.dimensions?.height}H
                    <span className="text-white font-noto font-semibold">
                      ({(metricLength || 0).toFixed(0)}x{(metricWidth || 0).toFixed(0)}x
                      {(metricHeight || 0).toFixed(0)}mm)
                    </span>
                  </p>
                  <p className="text-xs text-white font-noto font-semibold">
                    <span className="font-bold uppercase font-apotek-extended tracking-wider">
                      Cycles:
                    </span>{' '}
                    {product.specifications?.cycles} @ 80% DOD
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex md:justify-end justify-center  p-4 bg-black text-white ">
        <div className="relative flex justify-between items-center">
          <div className="flex items-center md:flex-row flex-col justify-center gap-4">
            <h3 className="text-white font-apotek-extended text-2xl">
              ${typeof priceToShow === 'number' ? priceToShow.toFixed(2) : priceToShow}
            </h3>
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
            <Link href={`/products/${product.slug}`}>
              <Button variant="outline" className="hover:cursor-pointer">
                View More Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IsBatterySpecs
