import { Link } from "react-router-dom";

import { Mail } from "lucide-react";
import { CONTACT_EMAILS, SUPPORT_EMAIL, mailtoHref } from "@/lib/emails";

type Block =
  | { type: "meta"; text: string }
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] };

interface PageContent {
  title: string;
  body: string[];
  blocks?: Block[];
}

const CONTENT: Record<string, PageContent> = {
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
  "seller-terms": {
    title: "Seller Terms & Conditions",
    body: [],
    blocks: [
      { type: "meta", text: "Last updated: 30 August 2026" },
      {
        type: "p",
        text: "These Seller Terms and Conditions (\"Seller Terms\") govern your use of the CAPTTURE marketplace as a seller.",
      },
      {
        type: "p",
        text: "By registering as a seller, listing products, accepting orders, or otherwise using the CAPTTURE seller platform, you agree to be bound by these Seller Terms, CAPTTURE's general Terms and Conditions, Privacy Policy, and any other marketplace policies published by CAPTTURE.",
      },
      {
        type: "p",
        text: "If you do not agree to these terms, you may not register or operate a seller store on CAPTTURE.",
      },
      { type: "h2", text: "1. Definitions" },
      { type: "p", text: "For these Seller Terms:" },
      {
        type: "list",
        items: [
          "\"CAPTTURE\", \"we\", \"us\" or \"our\" means the CAPTTURE marketplace and its operators.",
          "\"Seller\", \"you\" or \"your\" means any individual, business, brand, or entity registered to sell products on CAPTTURE.",
          "\"Buyer\" or \"customer\" means a person purchasing products through CAPTTURE.",
          "\"Product\" means any item, service, or merchandise listed by a Seller on CAPTTURE.",
          "\"Marketplace\" means the CAPTTURE website, applications, seller dashboard, and related services.",
        ],
      },
      { type: "h2", text: "2. Seller Eligibility" },
      {
        type: "list",
        items: [
          "Sellers must provide accurate and complete information when registering.",
          "You must be legally permitted to sell the products you list on CAPTTURE.",
          "CAPTTURE may request additional information or documentation to verify your identity, business, products, or store.",
          "You are responsible for keeping your seller information accurate and up to date.",
          "CAPTTURE reserves the right to approve, reject, restrict, suspend, or terminate a seller account at its discretion where permitted by law.",
        ],
      },
      { type: "h2", text: "3. Seller Account" },
      {
        type: "list",
        items: [
          "You are responsible for maintaining the security of your seller account and login credentials.",
          "You must not share your seller account with unauthorised persons.",
          "You are responsible for all activity conducted through your account.",
          "You must immediately notify CAPTTURE if you believe your account has been compromised.",
          "Sellers may not create multiple accounts for the purpose of avoiding restrictions, suspensions, penalties, or other marketplace controls.",
        ],
      },
      { type: "h2", text: "4. Product Listings" },
      {
        type: "list",
        items: [
          "Sellers must provide accurate information about every product listed.",
          "Product listings should include, where applicable: product name, description, price, available quantity, size or variation, colour, material, condition, clear product images, and relevant specifications.",
          "Product descriptions and images must accurately represent the product being sold.",
          "Sellers must not intentionally mislead buyers regarding the quality, condition, origin, availability, or characteristics of a product.",
          "Sellers must keep product stock information reasonably accurate.",
          "If a product becomes unavailable, the Seller must promptly update or remove the listing.",
        ],
      },
      { type: "h2", text: "5. Prohibited Products" },
      {
        type: "p",
        text: "Sellers may not list or sell products that are illegal, dangerous, fraudulent, counterfeit, stolen, or otherwise prohibited by CAPTTURE. Prohibited products may include, but are not limited to:",
      },
      {
        type: "list",
        items: [
          "Counterfeit or fake branded products",
          "Stolen goods",
          "Products that infringe intellectual property rights",
          "Illegal drugs or controlled substances",
          "Firearms, ammunition, and prohibited weapons",
          "Explosives",
          "Fraudulent documents",
          "Products prohibited by South African law",
          "Products that CAPTTURE determines pose an unacceptable risk to buyers or the marketplace",
          "Any other products prohibited by CAPTTURE from time to time",
        ],
      },
      {
        type: "p",
        text: "CAPTTURE may remove prohibited listings and suspend or terminate accounts involved in prohibited activity.",
      },
      { type: "h2", text: "6. Authenticity & Intellectual Property" },
      {
        type: "list",
        items: [
          "Sellers must have the legal right to sell the products they list.",
          "Sellers must not upload or use photographs, logos, trademarks, designs, descriptions, or other intellectual property belonging to another person or business without permission.",
          "Sellers must not sell counterfeit products or products falsely represented as genuine.",
          "If CAPTTURE receives a credible intellectual-property complaint, CAPTTURE may temporarily remove the relevant listing while the matter is investigated.",
          "Sellers are responsible for claims arising from products or content that they unlawfully sell or upload.",
        ],
      },
      { type: "h2", text: "7. Pricing" },
      {
        type: "list",
        items: [
          "Sellers are responsible for setting their own product prices unless otherwise agreed with CAPTTURE.",
          "Prices must be displayed accurately.",
          "Sellers may not intentionally manipulate prices to mislead buyers.",
          "Sellers must honour accepted orders at the price displayed to the buyer, subject to applicable law and CAPTTURE's policies.",
          "Sellers are responsible for any applicable taxes, duties, levies, registrations, licences, or other legal obligations arising from their sales.",
        ],
      },
      { type: "h2", text: "8. Orders" },
      {
        type: "list",
        items: [
          "Sellers must process accepted orders promptly.",
          "Sellers must ensure that products supplied match the buyer's order.",
          "Sellers must not intentionally accept orders for products they know they cannot fulfil.",
          "If a Seller cannot fulfil an order, the Seller must notify CAPTTURE as soon as reasonably possible.",
          "Repeated cancellations, failure to fulfil orders, or misleading stock information may result in restrictions or suspension.",
        ],
      },
      { type: "h2", text: "9. Shipping & Delivery" },
      {
        type: "list",
        items: [
          "Sellers are responsible for preparing orders safely and appropriately for delivery.",
          "Sellers must use the shipping method required or approved by CAPTTURE where applicable.",
          "Sellers must provide accurate shipping information and tracking information where available.",
          "Sellers must dispatch orders within the timeframe communicated to the buyer.",
          "Sellers must package products appropriately to reduce the risk of damage during transportation.",
          "Sellers must not deliberately provide false tracking information.",
          "Sellers are responsible for complying with applicable shipping requirements and restrictions.",
          "Repeated late dispatches, missing parcels, inadequate packaging, or failure to meet CAPTTURE shipping requirements may result in seller restrictions.",
        ],
      },
      { type: "h2", text: "10. Returns, Refunds & Defective Products" },
      {
        type: "list",
        items: [
          "Sellers must comply with applicable South African consumer-protection laws, including the Consumer Protection Act where applicable.",
          "Buyers may be entitled to remedies where products are defective, damaged, incorrectly described, incorrectly supplied, or otherwise fail to meet applicable legal requirements.",
          "Sellers must cooperate with CAPTTURE in resolving buyer complaints.",
          "CAPTTURE may request photographs, order information, tracking information, or other evidence when investigating a dispute.",
          "Where a refund or return is legally required or approved under CAPTTURE policy, the Seller must cooperate with the process.",
          "Sellers must not misrepresent the condition of products to avoid legitimate refunds or returns.",
        ],
      },
      { type: "h2", text: "11. Seller Payments" },
      {
        type: "list",
        items: [
          "Sellers may receive payment for completed sales in accordance with CAPTTURE's applicable payment and payout procedures.",
          "CAPTTURE may delay, hold, reverse, or adjust payouts where reasonably necessary to investigate fraud, chargebacks, refunds, buyer disputes, suspicious transactions, policy violations, incorrect order information, or other payment-related risks.",
          "Sellers are responsible for providing correct banking or payment information.",
          "CAPTTURE is not responsible for delays caused by incorrect payment information supplied by the Seller.",
          "CAPTTURE may introduce seller fees, commissions, subscription fees, or other charges in the future. Where required, Sellers will be notified before applicable charges take effect.",
        ],
      },
      { type: "h2", text: "12. Customer Communication" },
      {
        type: "list",
        items: [
          "Sellers must communicate with buyers professionally and respectfully.",
          "Sellers must not harass buyers, threaten buyers, send abusive or discriminatory messages, attempt to defraud buyers, pressure buyers into completing transactions outside CAPTTURE, request unnecessary personal information, or use buyer information for unauthorised marketing.",
          "Sellers must not attempt to bypass CAPTTURE's marketplace by directing buyers to complete transactions privately in order to avoid applicable CAPTTURE fees or protections.",
        ],
      },
      { type: "h2", text: "13. Seller Content" },
      {
        type: "list",
        items: [
          "Sellers retain ownership of content they upload, subject to the rights granted to CAPTTURE under these terms.",
          "By uploading product photographs, descriptions, logos, videos, or other content, the Seller grants CAPTTURE a non-exclusive, worldwide, royalty-free licence to use, reproduce, display, modify, and distribute that content for purposes connected with operating, marketing, promoting, and improving the CAPTTURE marketplace.",
          "Sellers confirm that they have the necessary rights to provide this content to CAPTTURE.",
        ],
      },
      { type: "h2", text: "14. Reviews & Ratings" },
      {
        type: "list",
        items: [
          "Buyers may rate or review products and Sellers.",
          "Sellers must not manipulate ratings or reviews.",
          "Sellers may not create fake buyer accounts or arrange fake purchases for the purpose of increasing ratings.",
          "Sellers must not offer money, products, discounts, or other benefits in exchange for dishonest reviews.",
          "CAPTTURE may remove reviews or ratings that violate applicable policies.",
        ],
      },
      { type: "h2", text: "15. Fraud & Marketplace Abuse" },
      {
        type: "p",
        text: "Sellers must not engage in fraudulent or deceptive activity, including:",
      },
      {
        type: "list",
        items: [
          "Fake orders",
          "Fake reviews",
          "Payment fraud",
          "Identity fraud",
          "Chargeback abuse",
          "Selling stolen goods",
          "Creating multiple accounts to evade restrictions",
          "Manipulating marketplace systems",
          "Providing false information",
          "Attempting to exploit technical vulnerabilities",
          "Circumventing CAPTTURE's payment or transaction systems",
        ],
      },
      {
        type: "p",
        text: "CAPTTURE may suspend accounts and take other appropriate action where fraudulent activity is suspected. Where appropriate, CAPTTURE may report suspected unlawful activity to relevant authorities.",
      },
      { type: "h2", text: "16. Seller Data & Privacy" },
      {
        type: "list",
        items: [
          "Sellers may receive certain buyer information necessary to fulfil orders.",
          "Sellers must use buyer information only for legitimate purposes connected with the relevant transaction.",
          "Sellers must not sell, share, publish, or misuse buyer information.",
          "Sellers must take reasonable steps to protect customer information from unauthorised access.",
          "Sellers must comply with applicable privacy and data-protection laws.",
        ],
      },
      { type: "h2", text: "17. Seller Performance" },
      {
        type: "p",
        text: "CAPTTURE may monitor seller performance, including order fulfilment, cancellation rates, dispatch times, delivery performance, product accuracy, customer complaints, refund and return rates, policy violations, buyer ratings, and suspected fraudulent activity.",
      },
      {
        type: "p",
        text: "Poor performance may result in warnings, reduced visibility, listing restrictions, temporary suspension, or termination.",
      },
      { type: "h2", text: "18. Account Suspension" },
      {
        type: "p",
        text: "CAPTTURE may temporarily suspend or permanently terminate a Seller's account where the Seller:",
      },
      {
        type: "list",
        items: [
          "Violates these Seller Terms",
          "Lists prohibited products",
          "Sells counterfeit or stolen products",
          "Engages in fraud",
          "Repeatedly fails to fulfil orders",
          "Provides false information",
          "Abuses buyers or CAPTTURE",
          "Attempts to circumvent marketplace rules",
          "Creates security risks",
          "Receives serious or repeated complaints",
          "Otherwise creates a significant risk to CAPTTURE, buyers, sellers, or the marketplace",
        ],
      },
      {
        type: "p",
        text: "Where appropriate, CAPTTURE may provide the Seller with an opportunity to address the issue or appeal the decision.",
      },
      { type: "h2", text: "19. Suspended Stores" },
      {
        type: "list",
        items: [
          "A suspended Seller may not create another account to bypass the suspension.",
          "CAPTTURE may restrict access to seller features while an investigation is ongoing.",
          "Orders already placed before suspension may still need to be fulfilled unless CAPTTURE instructs otherwise.",
          "CAPTTURE may retain information relating to a suspended or terminated account where necessary for legal, security, fraud-prevention, accounting, or operational purposes.",
        ],
      },
      { type: "h2", text: "20. Seller Appeals" },
      {
        type: "list",
        items: [
          "A Seller may contact CAPTTURE Support to appeal a suspension, listing removal, or other enforcement action where an appeal process is available.",
          "The Seller should provide relevant information or evidence supporting the appeal.",
          "CAPTTURE will review appeals in accordance with its applicable policies and circumstances.",
          "CAPTTURE's decision following an appeal may be final, subject to the Seller's rights under applicable law.",
        ],
      },
      { type: "h2", text: "21. Off-Platform Transactions" },
      {
        type: "p",
        text: "Sellers must not use CAPTTURE primarily to obtain customers and then deliberately move transactions outside the marketplace to avoid CAPTTURE's systems, fees, security measures, or buyer protections. This includes deliberately requesting or providing external payment details for the purpose of bypassing CAPTTURE.",
      },
      {
        type: "p",
        text: "CAPTTURE may take enforcement action where this occurs.",
      },
      { type: "h2", text: "22. Legal Compliance" },
      {
        type: "p",
        text: "Sellers are responsible for complying with all laws and regulations applicable to their business and products. This may include requirements relating to:",
      },
      {
        type: "list",
        items: [
          "Consumer protection",
          "Tax",
          "Product safety",
          "Intellectual property",
          "Privacy",
          "Business registration",
          "Advertising",
          "Labelling",
          "Importation and exportation",
          "Shipping",
          "Restricted products",
        ],
      },
      {
        type: "p",
        text: "CAPTTURE does not act as the Seller's legal, tax, or regulatory adviser.",
      },
      { type: "h2", text: "23. Taxes" },
      {
        type: "list",
        items: [
          "Each Seller is responsible for determining and meeting their own tax obligations arising from sales through CAPTTURE.",
          "CAPTTURE may provide transaction information or records where required by law.",
          "Sellers should obtain independent professional advice regarding their tax obligations.",
        ],
      },
      { type: "h2", text: "24. Marketplace Availability" },
      {
        type: "list",
        items: [
          "CAPTTURE aims to keep the marketplace available and operational but does not guarantee uninterrupted or error-free access.",
          "CAPTTURE may temporarily suspend or modify marketplace services for maintenance, security, updates, technical problems, emergencies, legal requirements, or other operational reasons.",
        ],
      },
      { type: "h2", text: "25. Limitation of Liability" },
      {
        type: "p",
        text: "To the maximum extent permitted by applicable law, CAPTTURE is not responsible for losses arising from transactions between Sellers and Buyers where such losses result from the Seller's conduct, products, representations, failure to comply with these terms, or failure to comply with applicable law.",
      },
      {
        type: "p",
        text: "Nothing in these terms is intended to exclude or limit any liability that cannot lawfully be excluded or limited.",
      },
      { type: "h2", text: "26. Indemnity" },
      {
        type: "p",
        text: "To the extent permitted by law, Sellers agree to indemnify and hold CAPTTURE harmless against claims, losses, damages, liabilities, costs, and expenses arising from:",
      },
      {
        type: "list",
        items: [
          "Products sold by the Seller",
          "Seller's violation of these terms",
          "Seller's violation of applicable law",
          "Intellectual-property infringement",
          "Fraudulent or misleading conduct",
          "Misuse of customer information",
          "Claims arising from the Seller's business or products",
        ],
      },
      { type: "h2", text: "27. Changes to These Terms" },
      {
        type: "list",
        items: [
          "CAPTTURE may update these Seller Terms from time to time.",
          "Where appropriate, Sellers will be notified of material changes.",
          "Continued use of the marketplace after updated terms become effective constitutes acceptance of the revised terms, subject to applicable law.",
        ],
      },
      { type: "h2", text: "28. Governing Law" },
      {
        type: "p",
        text: "These Seller Terms are governed by the laws of the Republic of South Africa, subject to any mandatory rights or protections applicable to the parties.",
      },
      { type: "h2", text: "29. Contact & Support" },
      {
        type: "list",
        items: [
          "Sellers may contact CAPTTURE through the official support channels provided on the CAPTTURE platform.",
          "For account, order, technical, or marketplace-related issues, Sellers should provide sufficient information to allow CAPTTURE to investigate the matter.",
        ],
      },
      { type: "h2", text: "30. Seller Acceptance" },
      {
        type: "p",
        text: "By selecting \"I Agree\", creating a seller account, listing products, or selling products through CAPTTURE, you confirm that:",
      },
      {
        type: "list",
        items: [
          "You have read and understood these Seller Terms & Conditions.",
          "You agree to comply with CAPTTURE's Seller Terms and marketplace policies.",
          "You will provide accurate information about yourself, your business, and your products.",
          "You will comply with applicable South African laws and regulations.",
          "You understand that CAPTTURE may remove listings or restrict, suspend, or terminate seller accounts that violate these terms.",
        ],
      },
      {
        type: "p",
        text: "CAPTTURE reserves the right to enforce these terms to protect buyers, sellers, and the integrity of the marketplace.",
      },
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
      `Still stuck? Email ${SUPPORT_EMAIL} and a human will get back to you.`,
    ],
  },
  contact: {
    title: "Contact us",
    body: [
      "We'd love to hear from you. Choose the right channel below and we'll get back to you during business hours:",
    ],
  },
};

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "meta":
      return <p className="text-xs uppercase tracking-editorial text-neutral-400">{block.text}</p>;
    case "h2":
      return (
        <h2 className="pt-6 font-display text-xl font-medium uppercase tracking-tight text-neutral-900">{block.text}</h2>
      );
    case "list":
      return (
        <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-neutral-600 marker:text-brand-500">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    default:
      return <p className="leading-relaxed text-neutral-600">{block.text}</p>;
  }
}

export function StaticPage({ page }: { page: string }) {
  const content = CONTENT[page] ?? CONTENT.about;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
        <span className="h-px w-8 bg-brand-500" />
        {page === "about" ? "The house" : page === "contact" ? "Get in touch" : "Good to know"}
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-5xl">
        {content.title}
      </h1>
      <div className="mt-8 space-y-4">
        {content.blocks
          ? content.blocks.map((block, i) => <RenderBlock key={i} block={block} />)
          : content.body.map((para, i) => (
              <p key={i} className="leading-relaxed text-neutral-600">{para}</p>
            ))}
      </div>
      {page === "contact" && (
        <div className="mt-8 border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-medium uppercase tracking-tight text-neutral-900">
            Contact channels
          </h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {CONTACT_EMAILS.map(({ label, address, description }) => (
              <li key={address} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{label}</p>
                  <p className="text-sm text-neutral-500">{description}</p>
                </div>
                <a
                  href={mailtoHref(address)}
                  aria-label={`Email ${label} at ${address}`}
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-50 sm:self-auto"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {address}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-400">
            Business hours: Monday–Friday, 8:00–17:00 SAST.
          </p>
        </div>
      )}
      <div className="mt-10">
        <Link to="/shop" className="text-sm font-semibold uppercase tracking-editorial text-brand-700 hover:underline">
          ← Back to shopping
        </Link>
      </div>
    </div>
  );
}
