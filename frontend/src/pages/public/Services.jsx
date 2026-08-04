import { Link } from 'react-router-dom'
import ServiceCard from '../../components/ServiceCard'
import { secondaryServices } from '../../lib/servicesData'
import {
  HardHat,
  Wrench,
  RefreshCw,
  Headphones,
  CheckCircle2,
  ShieldCheck,
  Timer,
  Shield,
  Settings,
} from 'lucide-react'

const iconMap = {
  RefreshCw,
  Headphones,
}

export default function Services() {
  return (
    <main>
      {/* Hero Section */}
         <section style={{ backgroundColor: '#0f1419' }} className="text-white py-24">
          <div className="container">
            <div className="inline-block mb-4">
              <span className="badge-accent text-xs font-bold">TECHNICAL EXPERTISE</span>
            </div>
            <h1 className="font-heading text-5xl font-bold leading-tight mb-4">
              Our Services
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              Cutting-edge solutions for the integration, maintenance and support of your high-performance hardware infrastructure.
            </p>
          </div>
        </section>

      {/* Services Grid — bento layout */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Installation & Integration — main card */}
            <div className="md:col-span-8 bg-white border border-gray-200 p-8 rounded-xl transition-all duration-300 hover:border-[#F80000] group">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg mb-6">
                    <HardHat size={32} color="#F80000" />
                  </div>
                  <h3 className="font-heading text-3xl font-bold text-black mb-3">
                    Installation & Integration
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-xl">
                    Professional deployment of your interactive systems and digital signage
                    solutions. We ensure smooth integration into your existing environments.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 size={16} color="#F80000" />
                      On-site planning
                    </li>
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 size={16} color="#F80000" />
                      Structured cabling and connectivity
                    </li>
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 size={16} color="#F80000" />
                      Initial software configuration
                    </li>
                  </ul>
                </div>
                <div className="w-full h-64 rounded-lg bg-gray-100 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=500&fit=crop"
                    alt="Technician installing a 4K display"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* After-Sales Service & Repair — dark side card */}
            <div className="md:col-span-4 bg-[#0f1419] text-white p-8 rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-lg mb-6">
                  <Wrench size={24} color="#F80000" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">
                  After-Sales Service & Repair
                </h3>
                <p className="text-white/70 mb-4">
                  Responsive after-sales support to minimize downtime, with accurate diagnostics
                  and genuine parts guaranteed.
                </p>
              </div>
              <div className="mt-8">
                <button
                  className="w-full font-semibold px-6 py-3 rounded-lg border-2 transition-all"
                  style={{ borderColor: '#F80000', color: '#F80000', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F80000'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#F80000'
                  }}
                >
                  Repair Details
                </button>
              </div>
            </div>

            {/* Preventive Maintenance + 24/7 Technical Support */}
            {secondaryServices.map((service) => {
              const IconComponent = iconMap[service.icon] || RefreshCw
              return (
                <div key={service.id} className="md:col-span-6">
                  <ServiceCard
                    icon={IconComponent}
                    title={service.title}
                    description={service.description}
                    linkLabel={service.linkLabel}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Vengineers */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-4xl font-bold mb-6 text-black">
                Why Choose Vengineers?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We're not just hardware suppliers — we're your dedicated technology partners,
                committed to the performance of your installations.
              </p>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <ShieldCheck size={28} color="#F80000" className="shrink-0" />
                  <div>
                    <h4 className="font-heading text-lg font-semibold text-black mb-1">
                      Certified Expertise
                    </h4>
                    <p className="text-gray-600">
                      Our engineers are trained in the latest touch and display technologies.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Timer size={28} color="#F80000" className="shrink-0" />
                  <div>
                    <h4 className="font-heading text-lg font-semibold text-black mb-1">
                      Maximum Responsiveness
                    </h4>
                    <p className="text-gray-600">
                      Guaranteed intervention within 24 to 48 hours for clients under contract.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&h=500&fit=crop"
                  alt="Technical collaboration"
                  className="w-full h-[400px] object-cover"
                />
              </div>
              <div
                className="absolute -bottom-6 -left-6 text-white p-6 rounded-xl shadow-lg"
                style={{ backgroundColor: '#BC0100' }}
              >
                <div className="font-heading text-3xl font-bold leading-none">15+</div>
                <div className="text-xs uppercase tracking-wider mt-2">Years of Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure & Network Expertise */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&h=500&fit=crop"
                alt="Advanced IT infrastructure"
                className="w-full h-[400px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="section-subtitle">INFRASTRUCTURE</p>
              <h2 className="font-heading text-4xl font-bold mb-6 text-black">
                Infrastructure & Network Expertise
              </h2>
              <p className="text-gray-600 text-lg">
                We design and deploy robust server and network architectures to support your most
                demanding technology needs, guaranteeing optimal uptime and security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section style={{ backgroundColor: '#BC0100' }} className="text-white py-16">
        <div className="container">
          <div className="inline-block mb-4">
            <span className="badge-accent text-xs font-bold">INFRASTRUCTURE SPECIAL OFFER</span>
          </div>
          <h2 className="font-heading text-4xl font-bold mb-4">
            Expert Solutions for Your Infrastructure
          </h2>
          <p className="text-lg mb-12 max-w-2xl">
            Network Solutions, IT Services, Maintenance
          </p>

          <p className="text-base mb-8 max-w-3xl">
            Optimize your operational performance with our preventive maintenance services and
            our cutting-edge, sustainable solutions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Shield style={{ color: '#ECB115' }} size={28} className="mb-3" />
              <h3 className="font-heading font-bold text-lg">Network Solutions</h3>
            </div>

            <div className="p-6 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Settings style={{ color: '#ECB115' }} size={28} className="mb-3" />
              <h3 className="font-heading font-bold text-lg">IT Services</h3>
            </div>

            <div className="p-6 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Wrench style={{ color: '#ECB115' }} size={28} className="mb-3" />
              <h3 className="font-heading font-bold text-lg">Maintenance</h3>
            </div>
          </div>

          {/* <div className="flex gap-4">
            <Link
              to="/contact"
              className="px-6 py-3 rounded font-semibold transition-colors"
              style={{ backgroundColor: 'white', color: '#F80000' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Take Advantage of This Offer
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded border-2 border-white font-semibold transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Learn More
            </Link>
          </div> */}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center">
        <div className="container max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl font-bold mb-4 text-black">
            Ready to optimize your infrastructure?
          </h2>
          <p className="text-gray-600 mb-8">
            Talk to a Vengineers expert about your project today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-lg text-white font-semibold transition-all"
              style={{ backgroundColor: '#F80000' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Request a Free Quote
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto px-8 py-4 rounded-lg border-2 border-black text-black font-semibold hover:bg-black hover:text-white transition-all"
            >
              View Our Products
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}