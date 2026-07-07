import Image from "next/image";
import Link from "next/link";
import { Leaf, Sprout, Truck, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 py-12 text-center">
        <Image
          src="/logo.png"
          alt="StrainCollector"
          width={600}
          height={480}
          className="mb-6 w-[min(600px,90vw)] h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)]"
          priority
        />
        <p className="max-w-lg text-lg text-white/60 mb-10 leading-relaxed">
          Premium cannabis genetics. Fresh snips and rooted clones shipped nationwide via USPS Priority Mail.
        </p>

        {/* Category Cards */}
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl w-full">
          <Link
            href="/fresh-snips"
            className="group glass-card rounded-3xl p-8 text-center transition-all duration-300 hover:border-brand-400/40 hover:glow-gold no-underline"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-jungle-green to-jungle-green-light shadow-lg">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white mb-2 group-hover:text-brand-400 transition-colors">
              Fresh Snips
            </h2>
            <p className="text-white/50 text-sm mb-4">Freshly cut genetics ready for rooting.</p>
            <div className="inline-block rounded-full bg-brand-400/15 px-4 py-1.5 text-sm font-bold text-brand-400">
              3 for $100
            </div>
          </Link>

          <Link
            href="/rooted-clones"
            className="group glass-card rounded-3xl p-8 text-center transition-all duration-300 hover:border-jungle-purple/40 hover:glow-purple no-underline"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-jungle-purple to-jungle-purple-light shadow-lg">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white mb-2 group-hover:text-jungle-purple-light transition-colors">
              Rooted Clones
            </h2>
            <p className="text-white/50 text-sm mb-4">Established roots ready to transplant.</p>
            <div className="inline-block rounded-full bg-jungle-purple/20 px-4 py-1.5 text-sm font-bold text-jungle-purple-light">
              From $15/ea @ volume
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Truck,
              title: "Priority Shipping",
              desc: "USPS Priority Mail with tracking on every order.",
              color: "from-jungle-teal to-jungle-teal-light",
            },
            {
              icon: Shield,
              title: "Secure Handling",
              desc: "Discreet, professional packaging for safe delivery.",
              color: "from-jungle-green to-jungle-green-light",
            },
            {
              icon: Clock,
              title: "Quick Turnaround",
              desc: "Orders fulfilled and shipped within 1-2 business days.",
              color: "from-jungle-purple to-jungle-purple-light",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-md`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
