// src/pages/public/Home.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../src/pages/public/Home";
import api from "../src/services/api";

vi.mock("../src/services/api", () => ({
  default: { get: vi.fn() },
}));

// FeaturedProductCard has its own dedicated test suite; stub it here so
// Home's tests only assert what Home itself controls (loading/empty/error
// handling and which products get passed down).
vi.mock("../src/components/FeaturedProductCard", () => ({
  default: ({ product }) => (
    <div data-testid="featured-product">{product.name}</div>
  ),
}));

// Static data file, already covered elsewhere; mocked here for a
// deterministic, content-independent test of the Testimonials section.
vi.mock("../src/data/testimonialsData", () => ({
  default: [
    {
      id: 1,
      quote: "Vengineers transformed our meeting rooms.",
      avatar: "https://example.com/avatar1.jpg",
      name: "Jane Doe",
      role: "IT Director",
    },
    {
      id: 2,
      quote: "Reliable hardware and great support.",
      avatar: "https://example.com/avatar2.jpg",
      name: "John Smith",
      role: "Operations Manager",
    },
  ],
}));

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe("Home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows three skeleton placeholders while featured products are loading", () => {
    api.get.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderHome();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });

  it("renders featured products once the request resolves", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [
          { id: 1, name: "Touch Panel 55" },
          { id: 2, name: "Touch Panel 75" },
          { id: 3, name: "Interactive Whiteboard" },
        ],
      },
    });

    renderHome();

    const cards = await screen.findAllByTestId(
      "featured-product",
      {},
      { timeout: 3000 }
    );
    expect(cards).toHaveLength(3);
    expect(screen.getByText("Touch Panel 55")).toBeInTheDocument();
    expect(screen.getByText("Interactive Whiteboard")).toBeInTheDocument();
  });

  it("requests only 3 featured products from the API", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderHome();

    await screen.findByText(
      "No products available at the moment.",
      {},
      { timeout: 3000 }
    );

    expect(api.get).toHaveBeenCalledWith("/products", {
      params: { per_page: 3 },
    });
  });

  it("shows an empty state message when no featured products are returned", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderHome();

    expect(
      await screen.findByText(
        "No products available at the moment.",
        {},
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
  });

  it("falls back to the empty state when the featured products request fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    api.get.mockRejectedValue(new Error("Network Error"));

    renderHome();

    expect(
      await screen.findByText(
        "No products available at the moment.",
        {},
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("renders the hero heading, intro copy and primary CTA", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(
      screen.getByRole("heading", { name: /touch excellence, redefined\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Vengineers Co\. Ltd\. supplies an innovative/i)
    ).toBeInTheDocument();

    const exploreLink = screen.getByRole("link", {
      name: /explore the range/i,
    });
    expect(exploreLink).toHaveAttribute("href", "/products");
  });

  it("renders the hardcoded partner banner (Dell, eBeam, Cyberoam)", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(screen.getByText("DELL")).toBeInTheDocument();
    expect(screen.getByText("eBeam")).toBeInTheDocument();
    expect(screen.getByText("Cyberoam")).toBeInTheDocument();
  });

  it("renders the Featured Products section header and catalog link", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(
      screen.getByRole("heading", { name: /featured products/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view full catalog/i })
    ).toHaveAttribute("href", "/products");
  });

  it("renders the infrastructure promo banner with its two CTAs", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(
      screen.getByRole("heading", {
        name: /expert solutions for your infrastructure/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get the offer/i })).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(screen.getByRole("link", { name: /learn more/i })).toHaveAttribute(
      "href",
      "/services"
    );
  });

  it("renders the 'Why Choose Vengineers' section content", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(
      screen.getByRole("heading", { name: /why choose venineers\?/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Certified Expertise")).toBeInTheDocument();
    expect(screen.getByText("Maximum Responsiveness")).toBeInTheDocument();
  });

  it("renders the testimonials section with each mocked testimonial", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(
      screen.getByRole("heading", { name: /trusted by businesses/i })
    ).toBeInTheDocument();
    expect(screen.getByText('"Vengineers transformed our meeting rooms."')).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("IT Director")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });
});
