import { Link } from 'react-router-dom'
import { Lightbulb, ShieldCheck, Headphones, MousePointerClick } from 'lucide-react'

const COLORS = {
  primary: '#F80000',
  primaryHover: '#C62221',
  gold: '#ECB115',
  ctaBg: '#8F706B',
  black: '#000000',
}

const stats = [
  { number: '15+', label: 'Years of Experience' },
  { number: '500+', label: 'International Clients' },
  { number: '24/7', label: 'Technical Support' },
  { number: '98%', label: 'Satisfaction Rate' },
]

const values = [
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We continuously invest in R&D to deliver touchscreens with imperceptible latency and exceptional clarity.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality',
    description:
      'Every piece of hardware undergoes a rigorous battery of tests under extreme conditions to guarantee flawless industrial reliability.',
  },
  {
    icon: Headphones,
    title: 'Service',
    description:
      "Our commitment doesn't stop at delivery. We support our clients with dedicated assistance and ongoing technical expertise.",
  },
]

export default function About() {
  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-16 md:py-24 px-6"
        style={{ backgroundColor: COLORS.primary }}
      >
        <div className="container relative z-10 text-white text-center md:text-left">
          <span className="inline-block px-3 py-1 badge-accent rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ color: COLORS.black }}>
            Interactive Excellence
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-4">
            About Vengineers
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto md:mx-0">
            Vengineers Co. Ltd. supplies an innovative and comprehensive range of IT solutions in
            computer hardware &amp; networking technologies, along with repair, maintenance &amp;
            support services.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900">
              Our Vision &amp; Mission
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Founded with the conviction that technology must not only be functional but also
              intuitive and durable, Vengineers has positioned itself as the trusted partner for
              businesses seeking visual excellence.
            </p>
            <div
              className="p-6 rounded-r-xl border-l-4"
              style={{ backgroundColor: '#F7F7F7', borderLeftColor: COLORS.primary }}
            >
              <p className="italic text-gray-800 text-lg">
                "Innovation is not about adding features, but about removing the obstacles between
                the user and their interface."
              </p>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Our story is marked by a constant pursuit of technical excellence, from component
              selection to final assembly in our workshops.
            </p>
          </div>

          <div className="relative group">
            <div
              className="absolute -inset-4 rounded-xl blur-2xl transition-all group-hover:opacity-80"
              style={{ backgroundColor: `${COLORS.primary}0D` }}
            />
            
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=500&fit=crop"
              alt="Vengineers team at work"
              className="relative w-full h-72 md:h-[500px] object-cover rounded-xl shadow-lg border border-gray-200"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-20 px-6" style={{ backgroundColor: '#F7F7F7' }}>
        <div className="container">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-gray-900 mb-10 md:mb-12">
            Vengineers by the Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-6 rounded-xl border border-gray-200 text-center transition-colors hover:border-[#F80000]"
              >
                <div
                  className="font-heading text-3xl md:text-4xl font-bold mb-2"
                  style={{ color: COLORS.primary }}
                >
                  {stat.number}
                </div>
                <div className="text-xs md:text-sm font-semibold uppercase tracking-tight text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-10 md:mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600">
              We build the future of interactive interfaces on three inseparable pillars that
              guide every one of our decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div
                  key={value.title}
                  className="p-8 rounded-xl border border-gray-200 text-center transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#F7F7F7' }}
                >
                  <div className="flex justify-center mb-4">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.primary}1A` }}
                    >
                      <Icon size={32} style={{ color: COLORS.primary }} />
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-xl mb-2 text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6" style={{ backgroundColor: '#F7F7F7' }}>
        <div
          className="container rounded-3xl p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-white"
          style={{ backgroundColor: COLORS.ctaBg }}
        >
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your space?
            </h2>
            <p className="text-base md:text-lg mb-8 text-white/90">
              Discover how our interactive solutions can revolutionize the way you communicate and
              collaborate.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link
                to="/products"
                className="px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
                style={{ backgroundColor: COLORS.primary }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
              >
                Browse the Catalog
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 rounded-lg border-2 border-white font-semibold transition-colors hover:bg-white/10"
              >
                Talk to an Expert
              </Link>
            </div>
          </div>

          <div className="hidden md:flex relative z-10 items-center justify-center">
            <div
              className="w-64 h-64 rounded-full flex items-center justify-center animate-pulse"
              style={{ border: `2px solid ${COLORS.gold}4D` }}
            >
              <div
                className="w-48 h-48 rounded-full flex items-center justify-center"
                style={{ border: `2px solid ${COLORS.gold}80` }}
              >
                <MousePointerClick size={56} style={{ color: COLORS.gold }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}