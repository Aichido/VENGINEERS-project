// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Fingerprint,
  Laptop,
  PenLine,
  Shield,
  Network,
  Terminal,
  Wrench,
  Star,
} from "lucide-react";
import api from '../../services/api'
import FeaturedProductCard from "../../components/FeaturedProductCard";
import testimonialsData from "../../data/testimonialsData";

function FeaturedProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E1E3E4] p-3 flex flex-col animate-pulse">
      <div className="h-64 rounded-lg mb-3 bg-[#F7F7F7]" />
      <div className="h-3 w-20 bg-[#F7F7F7] rounded mb-2" />
      <div className="h-5 w-3/4 bg-[#F7F7F7] rounded mb-2" />
      <div className="h-4 w-full bg-[#F7F7F7] rounded mb-1" />
      <div className="h-4 w-2/3 bg-[#F7F7F7] rounded mb-4" />
      <div className="h-5 w-24 bg-[#F7F7F7] rounded mb-4" />
      <div className="h-10 w-full bg-[#F7F7F7] rounded-lg" />
    </div>
  );
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchFeaturedProducts() {
      setIsLoading(true);
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const [response] = await Promise.all([
          api.get("/products", { params: { per_page: 3 } }),
          minDelay,
        ]);

        if (isMounted) {
          setFeaturedProducts(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to load featured products:", error);
        if (isMounted) {
          setFeaturedProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchFeaturedProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 md:px-8 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
             <div className="inline-block mb-4">
                  <span className="badge-accent text-xs font-bold">CUTTING-EDGE TECHNOLOGY</span>
              </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-black mb-6">
              Touch excellence, <br />
              <span className="text-[#F80000]">redefined.</span>
            </h1>
            <p className="text-lg text-[#404040] mb-8 max-w-lg leading-relaxed">
              Vengineers Co. Ltd. supplies an innovative and comprehensive
              range of IT solutions in computer hardware &amp; networking
              technologies, along with repair, maintenance &amp; support
              services.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="bg-[#BC0100] text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#C62221] hover:shadow-lg transition-all group"
              >
                Explore the range
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#F80000] opacity-5 rounded-full blur-[100px]" />
            <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl border border-[#E1E3E4] bg-white p-3">
              <img
                className="w-full h-auto object-cover rounded-lg"
                alt="A premium 4K touchscreen monitor displayed in a high-end corporate boardroom."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIF9Q_uUyEsiG4zDvvNaG8WcehEybMGPZMHpg6JO0IpczaPj0DuEcZVTn1CHqgCcVlsotvVSCiL4z3kdFdGYZJIFZ9ip0cxjRBphZybOmklQNRyHuoIW58Js0Iao8Dll3Qk3uJ1HPcKlla6OEtWCUAZtG1WB-GA_p-prFCrSTI0DAnpP4l-YdPflXJUiUAkLIbLBCADf6U0XuQPCxkKjreQi-kJvCZd735sABG8byxLYjRiBAazeh-4GK_UaFs8C_KdHqInMdkUA"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-xl shadow-xl z-20 border border-[#E1E3E4]">
              <div className="flex items-center gap-4">
                <div className="bg-[#ECB115]/20 p-2 rounded-lg">
                  <Fingerprint size={24} className="text-[#8a6600]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#F80000] leading-none mb-1">
                    15+ years
                  </p>
                  <p className="text-[10px] text-[#707070] uppercase tracking-wide">
                    of experience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Banner (hardcoded static content, no DB entity) */}
      <section className="bg-white py-10 border-y border-[#E1E3E4]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <p className="text-xs text-[#707070] mb-8 uppercase tracking-widest font-semibold">
            Trusted technology partners
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-60">
            <div className="flex items-center gap-2">
              <Laptop size={32} />
              <span className="text-xl font-bold text-black">DELL</span>
            </div>
            <div className="flex items-center gap-2">
              <PenLine size={32} />
              <span className="text-xl font-bold text-black">eBeam</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={32} />
              <span className="text-xl font-bold text-black">Cyberoam</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - real data from GET /api/products */}
      <section className="py-20 bg-[#F7F7F7] px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div>
              <h2 className="text-4xl font-bold text-black mb-2">
                Featured Products
              </h2>
              <p className="text-[#404040] max-w-md">
                Cutting-edge engineering for your workspaces.
              </p>
            </div>
            <Link
              to="/products"
              className="text-[#F80000] font-semibold flex items-center gap-1 hover:underline"
            >
              View full catalog <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <>
                <FeaturedProductSkeleton />
                <FeaturedProductSkeleton />
                <FeaturedProductSkeleton />
              </>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <FeaturedProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-center text-[#707070] py-12">
                No products available at the moment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Infrastructure Promo Banner (static) */}
      <section className="py-20 bg-white px-6 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-[#BC0100] rounded-xl overflow-hidden shadow-2xl">
            <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl">
                <div className="inline-block py-1 px-3 bg-[#ECB115] text-black rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
                  Special Infrastructure Offer
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Expert Solutions for your Infrastructure
                </h2>
                <p className="text-xl font-semibold text-[#ECB115] mb-6">
                  Network Solutions, IT &amp; Maintenance
                </p>
                <p className="text-lg text-white/80 mb-8">
                  Optimize your operational performance with our preventive
                  maintenance services and cutting-edge network solutions.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/contact"
                    className="bg-white text-[#F80000] px-8 py-4 rounded-lg font-semibold hover:bg-[#F7F7F7] transition-all active:scale-95"
                  >
                    Get the offer
                  </Link>
                  <Link
                    to="/services"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all"
                  >
                    Learn more
                  </Link>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-white">
                      <Network size={20} className="text-[#ECB115]" />
                      <span className="text-sm font-medium">
                        Network Solutions
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <Terminal size={20} className="text-[#ECB115]" />
                      <span className="text-sm font-medium">IT Services</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <Wrench size={20} className="text-[#ECB115]" />
                      <span className="text-sm font-medium">Maintenance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
              {/* Why Choose Section */}
        <section className="py-12 md:py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=500&fit=crop"
                    alt="Venineers Team"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                  >
                 <div
                    className="absolute bottom-4 right-4 text-white p-6 rounded-xl shadow-lg"
                    style={{ backgroundColor: '#BC0100' }}
                  >
                    <div className="font-heading text-3xl font-bold leading-none">15+</div>
                    <div className="text-xs uppercase tracking-wider mt-2">Years of Experience</div>
                  </div>
                  </div>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                  Why Choose Venineers?
                </h2>
                <p className="text-gray-600 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
                  We are more than just hardware suppliers - we are your technology partners committed to maximizing the performance of your installations.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span style={{ color: '#BC0100' }} className="text-2xl md:text-3xl flex-shrink-0">
                      ✓
                    </span>
                    <div>
                      <h3 className="font-heading font-bold mb-1 text-base md:text-lg">Certified Expertise</h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        Our engineers are trained in the latest interactive and display technologies.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span style={{ color: '#BC0100' }} className="text-2xl md:text-3xl flex-shrink-0">
                      ✓
                    </span>
                    <div>
                      <h3 className="font-heading font-bold mb-1 text-base md:text-lg">Maximum Responsiveness</h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        Guaranteed intervention within 24 hours in Mauritius for our priority clients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Testimonials (static) */}
      <section className="py-20 bg-white px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-3">
              Trusted by Businesses
            </h2>
            <p className="text-[#404040] max-w-2xl mx-auto">
              Vengineers supports over 500 companies and institutions
              worldwide in their digital transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonialsData.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-[#F7F7F7] p-8 rounded-xl shadow-sm border border-[#E1E3E4] flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-[#ECB115] mb-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={18} fill="currentColor" />
                    ))}
                  </div>
                  <p className="italic text-black mb-8">
                    "{testimonial.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-[#E1E3E4]">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#E1E3E4] shrink-0">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F80000]">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-[#707070] uppercase">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}