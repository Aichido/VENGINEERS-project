import { useState } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'
import api from '../services/api'

const initialForm = { name: '', email: '', phone: '', subject: '', message: '' }

export default function ContactForm() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrors({})
    try {
      await api.post('/contact', form)
      setStatus('success')
      setForm(initialForm)
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      }
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label htmlFor="contact-name" className="block text-sm font-semibold ml-1" style={{ color: '#000a1e' }}>
            Full name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Jean Dupont"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F80000] focus:border-[#F80000] outline-none transition-all"
            required
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name[0]}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="contact-email" className="block text-sm font-semibold ml-1" style={{ color: '#000a1e' }}>
            Business email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="jean@company.com"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F80000] focus:border-[#F80000] outline-none transition-all"
            required
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email[0]}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-phone" className="block text-sm font-semibold ml-1" style={{ color: '#000a1e' }}>
          Phone
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="+230 XXX XXXX"
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F80000] focus:border-[#F80000] outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-subject" className="block text-sm font-semibold ml-1" style={{ color: '#000a1e' }}>
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          value={form.subject}
          onChange={handleChange}
          placeholder="e.g. Quote request, technical question..."
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F80000] focus:border-[#F80000] outline-none transition-all"
          required
        />
        {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject[0]}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-message" className="block text-sm font-semibold ml-1" style={{ color: '#000a1e' }}>
          Your message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={form.message}
          onChange={handleChange}
          placeholder="Describe your technical need or project..."
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F80000] focus:border-[#F80000] outline-none transition-all resize-none"
          required
        />
        {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full md:w-auto text-white font-semibold px-8 py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        style={{ backgroundColor: status === 'success' ? '#16a34a' : '#F80000' }}
      >
        {status === 'loading' && (
          <>
            <Loader2 size={20} className="animate-spin" /> Sending...
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={20} /> Message sent
          </>
        )}
        {status !== 'loading' && status !== 'success' && (
          <>
            Send my request <Send size={20} />
          </>
        )}
      </button>

      {status === 'error' && Object.keys(errors).length === 0 && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}
    </form>
  )
}