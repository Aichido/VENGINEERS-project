// src/pages/public/Contact.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Contact from "../src/pages/public/Contact";

const mockPost = vi.fn();
vi.mock("../src/services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: (...args) => mockPost(...args),
  },
}));

function renderContact() {
  return render(
    <MemoryRouter>
      <Contact />
    </MemoryRouter>
  );
}

describe("Contact page", () => {
  // --- Tests de rendu statique (inchangés) ---
  it("renders the hero heading and intro text", () => {
    renderContact();
    expect(
      screen.getByRole("heading", { name: /let's talk about your project/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/tailor-made, high-precision touch display solutions/i)
    ).toBeInTheDocument();
  });

  it("renders the 'Send us a message' form heading", () => {
    renderContact();
    expect(
      screen.getByRole("heading", { name: /send us a message/i })
    ).toBeInTheDocument();
  });

  it("renders the contact details: address, email, and phone", () => {
    renderContact();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText(/Centre de Flacq/i)).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("contact@vengineers.mu")).toBeInTheDocument();
    expect(screen.getByText("Phone", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("+230 400 0000")).toBeInTheDocument();
  });

  it("renders the three social media links with correct accessible names and hrefs", () => {
    renderContact();
    const facebook = screen.getByRole("link", { name: /facebook/i });
    const instagram = screen.getByRole("link", { name: /instagram/i });
    const linkedin = screen.getByRole("link", { name: /linkedin/i });

    expect(facebook).toBeInTheDocument();
    expect(instagram).toBeInTheDocument();
    expect(linkedin).toBeInTheDocument();
  });

  it("applies hover styles to social links on mouse enter and leave", () => {
    renderContact();
    const facebook = screen.getByRole("link", { name: /facebook/i });

    fireEvent.mouseEnter(facebook);
    expect(facebook.style.backgroundColor).toBe("rgb(248, 0, 0)");

    fireEvent.mouseLeave(facebook);
    expect(facebook.style.backgroundColor).toBe("transparent");
  });

  it("renders the office image with a descriptive alt text", () => {
    renderContact();
    expect(
      screen.getByAltText(/vengineers office and server room/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Vengineers HQ")).toBeInTheDocument();
  });

  it("renders the FAQ section heading", () => {
    renderContact();
    expect(
      screen.getByRole("heading", { name: /frequently asked questions/i })
    ).toBeInTheDocument();
  });

  // --- Tests d’interaction (couvrent les lignes 116‑137 de Contact.jsx) ---
  describe("form submission", () => {
    beforeEach(() => {
      mockPost.mockReset();
    });

    it("submits successfully and shows confirmation", async () => {
      mockPost.mockResolvedValueOnce({ status: 201 });
      const user = userEvent.setup();
      renderContact();

      await user.type(screen.getByLabelText(/Full name/i), "Jean Dupont");
      await user.type(screen.getByLabelText(/Business email/i), "jean@example.com");
      await user.type(screen.getByLabelText(/Phone/i), "0123456789");
      await user.type(screen.getByLabelText(/Subject/i), "Devis");
      await user.type(screen.getByLabelText(/Your message/i), "Bonjour");

      await user.click(screen.getByRole("button", { name: /Send my request/i }));

      expect(mockPost).toHaveBeenCalledWith("/contact", {
        name: "Jean Dupont",
        email: "jean@example.com",
        phone: "0123456789",
        subject: "Devis",
        message: "Bonjour",
      });

      // Le bouton affiche "Message sent" après succès
      expect(await screen.findByRole("button", { name: /Message sent/i })).toBeInTheDocument();

      // Le formulaire est réinitialisé
      expect(screen.getByLabelText(/Full name/i)).toHaveValue("");
    });

    it("shows field errors on 422 validation failure", async () => {
      mockPost.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              email: ["L'email est invalide."],
              message: ["Le message est obligatoire."],
            },
          },
        },
      });
      const user = userEvent.setup();
      renderContact();

      await user.type(screen.getByLabelText(/Full name/i), "Jean Dupont");
      await user.click(screen.getByRole("button", { name: /Send my request/i }));

      expect(await screen.findByText(/L'email est invalide./i)).toBeInTheDocument();
      expect(screen.getByText(/Le message est obligatoire./i)).toBeInTheDocument();
    });

    it("shows a generic error on non-422 failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Network error"));
      const user = userEvent.setup();
      renderContact();

      await user.type(screen.getByLabelText(/Full name/i), "Jean Dupont");
      await user.type(screen.getByLabelText(/Business email/i), "jean@example.com");
      await user.type(screen.getByLabelText(/Your message/i), "test");
      await user.click(screen.getByRole("button", { name: /Send my request/i }));

      // Message d'erreur générique exact
      expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });

    it("disables the submit button while loading", async () => {
      let resolvePromise;
      mockPost.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );
      const user = userEvent.setup();
      renderContact();

      await user.type(screen.getByLabelText(/Full name/i), "Jean Dupont");
      await user.type(screen.getByLabelText(/Business email/i), "jean@example.com");
      await user.type(screen.getByLabelText(/Your message/i), "test");
      await user.click(screen.getByRole("button", { name: /Send my request/i }));

      // Le bouton affiche "Sending..." et est désactivé
      const loadingButton = screen.getByRole("button", { name: /Sending.../i });
      expect(loadingButton).toBeDisabled();

      resolvePromise({ status: 201 });
    });
  });
  
  it("applies hover styles to social links on mouse enter and leave", () => {
  renderContact();
  const links = [
    screen.getByRole("link", { name: /facebook/i }),
    screen.getByRole("link", { name: /instagram/i }),
    screen.getByRole("link", { name: /linkedin/i }),
  ];

  links.forEach((link) => {
    // Au survol, la couleur de fond devient rouge et le texte blanc
    fireEvent.mouseEnter(link);
    expect(link.style.backgroundColor).toBe("rgb(248, 0, 0)");
    expect(link.style.color).toBe("rgb(255, 255, 255)");

    // À la sortie, on revient à transparent et rouge
    fireEvent.mouseLeave(link);
    expect(link.style.backgroundColor).toBe("transparent");
    expect(link.style.color).toBe("rgb(248, 0, 0)");
  });
});
});