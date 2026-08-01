import { useParams } from 'react-router-dom'

export default function ProductDetail() {
  const { id } = useParams()

  return (
    <section className="container py-16">
      <h1 className="text-3xl font-heading font-bold mb-4">Product #{id}</h1>
      <p className="text-gray-600">Coming soon.</p>
    </section>
  )
}
