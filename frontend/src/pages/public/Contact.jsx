import { MapPin, Mail, Phone } from 'lucide-react'
import { FaLinkedin, FaFacebook, FaInstagram } from 'react-icons/fa6'
import ContactForm from '../../components/ContactForm'
import Faq from '../../components/Faq'
import { faqItems } from '../../lib/faqData'

export default function Contact() {
  return (
    <main>
      {/* Hero Section */}
      <section
        className="relative w-full h-[400px] flex items-center justify-center overflow-hidden px-6"
        style={{ backgroundColor: '#000a1e' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 text-center max-w-3xl">
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">
            Let's talk about your project
          </h1>
          <p className="text-lg text-gray-300">
            Contact our experts for tailor-made, high-precision touch display solutions.
          </p>
        </div>
      </section>

      {/* Contact Form + Coordinates */}
      <section className="container py-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form Card */}
        <div className="lg:col-span-7 bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-semibold mb-2" style={{ color: '#000a1e' }}>
              Send us a message
            </h2>
            <p className="text-gray-600">We'll get back to you within 24 business hours.</p>
          </div>
          <ContactForm />
        </div>

        {/* Coordinates & Map Side */}
        <div className="lg:col-span-5 space-y-6">
          {/* Information Card */}
          <div className="p-8 rounded-xl flex flex-col gap-8 text-white" style={{ backgroundColor: '#000a1e' }}>
            <div>
              <h3 className="font-heading text-2xl font-semibold mb-6">Contact details</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin size={22} color="#F80000" className="shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#F80000' }}>
                      Address
                    </p>
                    <p className="text-gray-300">
                      Centre de Flacq,
                      <br />
                      Mauritius
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail size={22} color="#F80000" className="shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#F80000' }}>
                      Email
                    </p>
                    <p className="text-gray-300">contact@vengineers.mu</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone size={22} color="#F80000" className="shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#F80000' }}>
                      Phone
                    </p>
                    <p className="text-gray-300">+230 400 0000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#F80000' }}>
              Follow us
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                aria-label="Facebook"
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300"
                style={{ borderColor: '#F80000', color: '#F80000' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F80000'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#F80000'
                }}
              >
                <FaFacebook size={20} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300"
                style={{ borderColor: '#F80000', color: '#F80000' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F80000'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#F80000'
                }}
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300"
                style={{ borderColor: '#F80000', color: '#F80000' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F80000'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#F80000'
                }}
              >
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Map / Office Placeholder */}
          <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-gray-200 grayscale hover:grayscale-0 transition-all duration-500 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop"
              alt="Vengineers office and server room"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-lg border border-gray-200 shadow-lg flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ backgroundColor: '#000a1e' }}>
                <MapPin size={18} color="#F80000" />
              </div>
              <span className="text-sm font-semibold" style={{ color: '#000a1e' }}>
                Vengineers HQ
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-10" style={{ color: '#000a1e' }}>
            Frequently Asked Questions
          </h2>
          <Faq items={faqItems} />
        </div>
      </section>
    </main>
  )
}