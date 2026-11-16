import { advisoryContent } from "./advisory-content";
import { aboutContent } from "./about-content";
import { defaultSiteImages } from "./site-images";

export const sitePageDefaults = {
  images: defaultSiteImages,
  'property-detail': {
    hero: { priceLabel: "GUIDE PRICE", priceNote: "Contact our Manali desk for availability and the latest terms.", briefButton: "Request property brief", visitButton: "Arrange a site visit", whatsappButton: "Speak to your advisor" },
    gallery: { eyebrow: "THE VISUAL COLLECTION", title: "A sense of the place.", intro: "Explore the property’s approved photography. Ask our team for further views and a personal introduction.", emptyTitle: "Photography on request.", emptyBody: "Speak to our Manali team for the latest photographs and the full property brief." },
    overview: { eyebrow: "THE PROPERTY", title: "A closer look.", amenitiesTitle: "Thoughtful details.", specsTitle: "Property at a glance", specsNote: "Listing details are supplied for your initial review. Confirm measurements, availability and terms before proceeding." },
    diligence: { eyebrow: "A CONSIDERED PURCHASE", title: "Clear questions. Informed decisions.", intro: "Build a complete picture of the property with independent advice and the supporting documents.", items: [
      { title: "Title & revenue records", body: "Request the ownership history, current revenue records and supporting title documents for independent review." },
      { title: "Buyer eligibility", body: "Discuss your eligibility and any required permissions with a qualified local adviser before making a commitment." },
      { title: "Access & approvals", body: "Ask about boundaries, legal access, services and the approvals relevant to your intended use." },
      { title: "Independent review", body: "Have your legal and technical advisers assess the documents and the property before you transact." },
    ], note: "A listing’s verification status does not constitute a title opinion, government approval or a guarantee of transaction eligibility.", link: "Read our policies & buying guidance" },
    advisor: { eyebrow: "YOUR MANALI PROPERTY DESK", title: "A personal introduction.", body: "Ask for the property brief, discuss your requirements or arrange a viewing with our local team.", whatsapp: "Continue on WhatsApp" },
  },
  home: {
    hero: {
      eyebrow: "THE QUIET SIDE OF PROPERTY",
      title: "Own a piece of the Himalayas.",
      intro: "Exceptional homes, hospitality estates and land. Carefully considered. Deeply connected to Manali.",
      proof: "Curated by local brokers",
      image: "/images/estate-0.jpg",
      slides: [
        { title: "A quieter kind of getaway.", intro: "Explore mountain homes and hospitality spaces, with local guidance at every step.", image: "/images/estate-1.jpg", alt: "A lodge among snowy Himalayan mountains", active: true },
        { title: "Room for a new perspective.", intro: "Discover land, orchards and places to put down roots around Manali.", image: "/images/estate-11.jpg", alt: "A green mountain landscape around Manali", active: true },
      ],
    },
    listings: { eyebrow: "THE LATEST EDIT", title: "Recently on our map." },
    approach: {
      eyebrow: "WHY HIMALAYAN ESTATES",
      title: "Good property is more than a pin on a map.",
      body: "The right place starts with the right questions. Access, land records, local conditions and the life you want to build here.",
      image: "/images/estate-11.jpg",
    },
  },
  about: aboutContent,
  global: {
    navigation: { home: "Home", location: "MANALI · HIMACHAL PRADESH", properties: "Properties", policies: "Policies", about: "About", advisory: "Buying in Manali", contact: "Contact" },
    footer: { collection: "The collection", hotels: "Hotels & resorts", land: "Land & orchards", homes: "Homes & villas", begin: "Let’s begin", broker: "Speak to a local broker", advisory: "Buying in Manali", privacy: "Privacy policy", closing: "Rooted here. Looking ahead." },
    inquiry: { eyebrow: "A PRIVATE CONVERSATION", title: "Your next chapter. Our local knowledge.", body: "Tell us what you have in mind. We’ll help you explore the right property, understand the details, and plan a visit.", location: "Manali · Himachal Pradesh", formEyebrow: "CONFIDENTIAL ENQUIRY", formTitle: "A place that feels like yours.", name: "Your name", email: "Email address", phone: "Phone number", preferred: "Preferred contact", message: "What are you looking for?", placeholder: "Property type, budget, preferred location, or a question…", consent: "I agree to be contacted about this enquiry.", submit: "Begin the conversation", successTitle: "Your enquiry is with us.", successBody: "Our team will contact you using the details you shared." },
  },
  properties: { hero: { eyebrow: "THE PRIVATE COLLECTION", title: "Find your place in the mountains.", intro: "Explore the current collection of Manali property opportunities.", image: "/images/estate-0.jpg" }, listings: { title: "The estate collection." } },
  contact: {
    services: {
      eyebrow: "HOW I CAN HELP",
      title: "Property services",
      intro: "Practical support whether you’re buying, selling, renting or exploring the region.",
      items: [
        { title: "Buy & Sell", description: "Guidance for buyers and owners looking to explore property opportunities." },
        { title: "Rentals", description: "Get in touch to discuss residential and holiday rental requirements." },
        { title: "Tour & Travel", description: "Also ask about travel assistance and experiences around Manali." },
      ],
    },
    contact: {
      eyebrow: "LET’S TALK",
      title: "Looking for property in Manali?",
      intro: "Tell me what you’re looking for and I’ll help you take the next step.",
      note: "Property details, availability and terms are subject to confirmation. Please verify all documents and approvals independently before any transaction.",
    },
  },
  advisory: advisoryContent,
  privacy: {
    hero: {
      eyebrow: "A CLEARER CONVERSATION",
      title: "Your privacy, kept considered.",
      intro: "How Himalayan Estates handles information shared through this website.",
    },
    section118: {
      eyebrow: "HIMACHAL PRADESH · LAND PURCHASE GUIDANCE",
      title: "Section 118 advisory.",
      intro: "Before choosing a property in Manali, discuss buyer eligibility, land classification and any required permissions with an independent local lawyer.",
      documentsTitle: "Essential revenue documentation",
      documentsBody: "Ask your adviser to review title history, revenue records, boundaries, access rights and the proposed use of the property before you commit.",
      processTitle: "A considered purchase process",
      steps: [
        "Review the land and ownership records.",
        "Check eligibility and the proposed use with your adviser.",
        "Confirm which permissions and supporting documents apply.",
        "Verify required approvals before proceeding.",
        "Arrange independent review of the sale deed and registration steps.",
      ],
      disclaimer: "This checklist is a starting point for discussion, not an eligibility decision or a guarantee of approval. Obtain property-specific legal advice.",
      linkLabel: "Read the Manali buyer’s guide",
    },
    policy: {
      title: "Privacy policy",
      updated: "15 November 2026",
      sections: [
        { title: "Information you choose to share", body: "When you send an enquiry, we may collect your name, email address, phone number, preferred contact method, property interests and message. We use this information to respond to your request, arrange viewings and provide the local property guidance you asked for." },
        { title: "How we use it", body: "We use enquiry details to communicate with you about relevant properties and services, keep a record of the conversation, and improve the website and our brokerage service. We do not sell enquiry information or use it for unrelated advertising." },
        { title: "Sharing and retention", body: "Information is shared only with people who need it to respond to your enquiry or provide a requested service, such as a property owner or professional adviser, and only where appropriate. We keep records for as long as needed to handle the enquiry and meet applicable legal or business requirements." },
        { title: "Your choices", body: "You can ask what personal information we hold, request a correction or ask us to stop contacting you. Contact us through the enquiry form with enough detail for us to identify your conversation. We may need to verify your request before making a change." },
        { title: "Cookies and third-party services", body: "The website may use essential technical storage and service providers for hosting, media delivery and form handling. Those providers may process limited technical information to operate the service. We do not use a third-party analytics or advertising profile as part of this public website unless this policy is updated." },
        { title: "Contact", body: "For privacy questions, send an enquiry marked “Privacy” and our Manali team will respond." },
      ],
    },
  },
} as const;

export type SitePageSlug = keyof typeof sitePageDefaults;

export const siteSettingDefaults = {
  "site.name": "Himalayan Estates",
  "site.tagline": "Properties with a point of view.",
  "contact.name": "Keshav Kumar Garg",
  "contact.phone": "+91 99833 33567",
  "contact.email": "",
  "contact.address": "Manali, Himachal Pradesh, India",
  "social.instagram": "",
  "social.facebook": "",
} as const;

export const sitePageTitles: Record<SitePageSlug, string> = {
  images: "Website images",
  'property-detail': "Property detail pages",
  home: "Himalayan Estates Home",
  about: "About Himalayan Estates",
  contact: "Contact & Property Services",
  advisory: "Buying Property in Manali",
  privacy: "Privacy & Section 118 Policies",
  global: "Navigation, footer & inquiry form",
  properties: "Property collection",
};
