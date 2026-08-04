import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Faq({ items }) {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-4 p-6 text-left"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              aria-expanded={isOpen}
            >
              <span className="font-heading font-semibold" style={{ color: '#000a1e' }}>
                {item.question}
              </span>
              <ChevronDown
                size={20}
                color="#F80000"
                className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && <div className="px-6 pb-6 text-gray-600">{item.answer}</div>}
          </div>
        )
      })}
    </div>
  )
}
