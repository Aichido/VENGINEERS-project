// src/components/FeaturedProductCard.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FeaturedProductCard from "../src/components/FeaturedProductCard";

function renderCard(product) {
  return render(
    <MemoryRouter>
      <FeaturedProductCard product={product} />
    </MemoryRouter>
  );
}

const baseProduct = {
  id: 42,
  name: "Interactive Touch Panel 75\"",
  description: "A large-format interactive touchscreen for classrooms and offices.",
  category: { name: "Écrans tactiles" },
  created_at: new Date().toISOString(), // recent by default
  images: [],
};

describe("FeaturedProductCard", () => {
  it("renders the product name and description", () => {
    renderCard(baseProduct);
    expect(screen.getByText(baseProduct.name)).toBeInTheDocument();
    expect(screen.getByText(baseProduct.description)).toBeInTheDocument();
  });

  it("links to the correct product detail page", () => {
    renderCard(baseProduct);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/42");
  });

  it("falls back to a picsum placeholder image when there are no images", () => {
    renderCard({ ...baseProduct, images: [] });
    const img = screen.getByAltText(baseProduct.name);
    expect(img).toHaveAttribute(
      "src",
      "https://picsum.photos/seed/product-42/600/400"
    );
  });

  it("uses the primary image when one is marked is_primary", () => {
    renderCard({
      ...baseProduct,
      images: [
        { path: "/images/secondary.jpg", is_primary: false },
        { path: "/images/primary.jpg", is_primary: true },
      ],
    });
    const img = screen.getByAltText(baseProduct.name);
    expect(img).toHaveAttribute("src", "/images/primary.jpg");
  });

  it("falls back to the first image when none is marked primary", () => {
    renderCard({
      ...baseProduct,
      images: [
        { path: "/images/first.jpg", is_primary: false },
        { path: "/images/second.jpg", is_primary: false },
      ],
    });
    const img = screen.getByAltText(baseProduct.name);
    expect(img).toHaveAttribute("src", "/images/first.jpg");
  });

  it("shows the New badge when the product was created less than 30 days ago", () => {
    renderCard({ ...baseProduct, created_at: new Date().toISOString() });
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("does not show the New badge when the product is older than 30 days", () => {
    const oldDate = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000
    ).toISOString();
    renderCard({ ...baseProduct, created_at: oldDate });
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  it("does not show the New badge when created_at is missing", () => {
    renderCard({ ...baseProduct, created_at: null });
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  it("renders the category badge when a category is present", () => {
    renderCard(baseProduct);
    expect(screen.getByText("Écrans tactiles")).toBeInTheDocument();
  });

  it("does not render a category badge when category is absent", () => {
    const { container } = renderCard({ ...baseProduct, category: null });
    expect(
      container.querySelector("span.uppercase.tracking-wide.text-\\[\\#707070\\]")
    ).not.toBeInTheDocument();
  });

  it("does not render a description paragraph when description is absent", () => {
    renderCard({ ...baseProduct, description: "" });
    expect(screen.queryByText(baseProduct.description)).not.toBeInTheDocument();
  });

  it("always renders the 'View details' call to action", () => {
    renderCard(baseProduct);
    expect(screen.getByText("View details")).toBeInTheDocument();
  });
});
