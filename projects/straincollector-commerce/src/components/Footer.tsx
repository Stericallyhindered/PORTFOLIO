import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="glass border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="StrainCollector"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="font-display text-lg font-semibold uppercase tracking-wider text-white">
                Strain<span className="text-brand-400">Collector</span>
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Premium genetics. Fresh snips and rooted clones shipped nationwide.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-brand-400">
              Shop
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/fresh-snips" className="text-sm text-white/50 transition-colors hover:text-brand-400">
                  Fresh Snips
                </Link>
              </li>
              <li>
                <Link href="/rooted-clones" className="text-sm text-white/50 transition-colors hover:text-brand-400">
                  Rooted Clones
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-white/50 transition-colors hover:text-brand-400">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-brand-400">
              Info
            </h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li>Payment arranged separately</li>
              <li>USPS Priority Mail shipping</li>
              <li>Flat $25 shipping on all orders</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} StrainCollector. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
