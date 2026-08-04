import { ArrowRight } from 'lucide-react'

export default function ServiceCard({ icon: Icon, title, description, linkLabel }) {
  return (
    <div className="bg-white border border-gray-200 p-8 rounded-xl group hover:border-[#F80000] transition-all h-full">
      <div className="flex items-start gap-4">
        <div className="p-4 bg-gray-50 rounded-lg shrink-0">
          <Icon size={28} color="#F80000" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-semibold text-black mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          {linkLabel && (
            <span className="text-[#F80000] font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-3 transition-all cursor-pointer">
              {linkLabel} <ArrowRight size={16} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
