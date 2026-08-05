import { Link } from "react-router-dom";

const CONTENT: Record<string, { title: string; body: string[] }> = {
  about: {
    title: "About CAPTTURE",
    body: [
      "CAPTTURE is a South African fashion marketplace built for homegrown creators. We connect independent designers and tailors directly with customers across the country.",
      "Every store on CAPTTURE is vetted before it can sell. Orders ship directly from the maker to your door, paid by EFT.",
      "We're proudly South African, and we believe local fashion deserves a stage. This is it.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "These terms govern your use of the CAPTTURE marketplace. By creating an account or placing an order you agree to them.",
      "Orders placed on CAPTTURE are fulfilled by independent sellers. CAPTTURE facilitates the transaction and provides buyer protection against orders that never arrive or are materially not as described.",
      "Sellers are responsible for the accuracy of their listings, the quality of their products and dispatch within the stated timeframe.",
      "Payment is by EFT. Orders are confirmed once payment reflects in the seller's bank account.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect the information you give us — name, contact details and delivery address — to process orders and keep your account secure.",
      "Your delivery details are shared with the sellers who fulfil your orders, and with no one else. We never sell your personal information.",
      "Payment is handled without CAPTTURE ever storing your banking credentials. You can request deletion of your account at any time by contacting support.",
    ],
  },
  help: {
    title: "Help & FAQ",
    body: [
      "Delivery: orders ship from each seller, with a flat R60 shipping fee per order and free shipping on orders over R1,000.",
      "Returns: if an item arrives damaged or not as described, raise it via your order within 7 days and we'll help you resolve it.",
      "Payments: choose EFT at checkout. Orders are confirmed once payment reflects.",
      "Still stuck? Email hello@cappture.co.za and a human will get back to you.",
    ],
  },
  contact: {
    title: "Contact us",
    body: [
      "We'd love to hear from you. For order help, seller questions or press enquiries:",
      "Email: hello@cappture.co.za",
      "Business hours: Monday–Friday, 8:00–17:00 SAST.",
    ],
  },
};

export function StaticPage({ page }: { page: string }) {
  const content = CONTENT[page] ?? CONTENT.about;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{content.title}</h1>
      <div className="mt-6 space-y-4">
        {content.body.map((para, i) => (
          <p key={i} className="leading-relaxed text-neutral-600">{para}</p>
        ))}
      </div>
      <div className="mt-10">
        <Link to="/shop" className="text-sm font-medium text-brand-700 hover:underline">
          ← Back to shopping
        </Link>
      </div>
    </div>
  );
}
