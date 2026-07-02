import React, { useState } from 'react'
import { Battery, Bluetooth, Zap } from 'lucide-react'
import Image from 'next/image'

interface BatterySpec {
  title: string
  value: string
}

const BatteryCard = () => {
  const [isHovered, setIsHovered] = useState(false)

  const specs: BatterySpec[] = [
    { title: 'Voltage', value: '12.8V' },
    { title: 'Capacity', value: '100Ah' },
    { title: 'Energy', value: '1600Wh' },
    { title: 'Weight', value: '31.96lbs' },
    { title: 'Cycles', value: '3000 @ 80% DOD' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div
        className="relative bg-black rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Content */}
        <div className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-wider">
                STRYKER <span className="text-primary">- CC 125Ah</span>
              </h1>
              <h2 className="text-2xl text-primary mt-2 font-semibold">Cold Crank</h2>
              <div className="mt-4 flex items-center gap-2">
                <Bluetooth className="text-blue-400 w-6 h-6" />
                <span className="text-white">Bluetooth Connectivity</span>
              </div>
            </div>
            <Battery className="text-primary w-16 h-16" />
          </div>

          <div className="mt-8">
            <Image
              src="https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=800"
              alt="Battery"
              className="w-full max-w-md mx-auto rounded-lg"
            />
          </div>
        </div>

        {/* Hover Specifications */}
        <div
          className={`absolute inset-0 bg-black/95 transform transition-transform duration-300 ${
            isHovered ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="p-8">
            <h3 className="text-3xl font-bold text-primary mb-6 flex items-center gap-2">
              <Zap className="w-8 h-8" />
              BATTERY SPECIFICATIONS
            </h3>

            <div className="grid grid-cols-2 gap-6">
              {specs.map((spec, index) => (
                <div key={index} className="border border-primary/30 rounded-lg p-4">
                  <h4 className="text-primary text-sm mb-1">{spec.title}</h4>
                  <p className="text-white text-xl font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-primary/10 rounded-lg p-4">
              <h4 className="text-primary mb-2">WARNING:</h4>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• DO NOT SHORT CIRCUIT</li>
                <li>• AVOID MECHANICAL SHOCK</li>
                <li>• KEEP AWAY FROM CHILDREN</li>
                <li>• DO NOT EXPOSE TO TEMP ABOVE 140 DEGREES F</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatteryCard
