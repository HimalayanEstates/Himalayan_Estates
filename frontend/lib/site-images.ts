import type { CSSProperties } from "react";

export const imageSlots = [
  { key: "homeHero", page: "Home", label: "Main hero", fallback: "/images/estate-0.jpg", alt: "Forested Manali valley beneath Himalayan peaks" },
  { key: "homeHeroSlide2", page: "Home", label: "Hero slide 2", fallback: "/images/estate-1.jpg", alt: "A lodge among snowy Himalayan mountains" },
  { key: "homeHeroSlide3", page: "Home", label: "Hero slide 3", fallback: "/images/estate-11.jpg", alt: "A green mountain landscape around Manali" },
  { key: "homeApproach", page: "Home", label: "Our approach", fallback: "/images/estate-11.jpg", alt: "A mountain retreat surrounded by forest" },
  ...["HOTEL", "LAND", "HOUSE_VILLA", "APARTMENT", "COMMERCIAL", "RESORT", "FARM", "OTHER"].map((category, index) => ({ key: `category${category}`, page: "Home", label: `${category.replaceAll("_", " ")} category`, fallback: `/images/estate-${index + 1}.jpg`, alt: `${category.replaceAll("_", " ").toLowerCase()} in Manali` })),
  { key: "collectionHero", page: "Properties", label: "Collection background", fallback: "/images/estate-0.jpg", alt: "Manali mountain landscape" },
  { key: "aboutHero", page: "About", label: "Page background", fallback: "/images/estate-1.jpg", alt: "Mountains around Manali" },
  { key: "aboutStory", page: "About", label: "Our story", fallback: "/images/estate-0.jpg", alt: "Mountain landscape around Manali" },
  { key: "advisoryHero", page: "Buyer’s guide", label: "Page background", fallback: "/images/estate-1.jpg", alt: "Himalayan hills" },
  { key: "privacyHero", page: "Policies", label: "Page background", fallback: "/images/estate-0.jpg", alt: "Manali valley" },
  { key: "contactHero", page: "Contact", label: "Contact background", fallback: "/images/estate-1.jpg", alt: "Manali hillside" },
  { key: "propertyHero", page: "Property details", label: "Dossier background", fallback: "/images/estate-10.jpg", alt: "Mountain property setting" },
] as const;

export type SiteImage = { url: string; alt: string; active: boolean };
export type SiteImages = Record<string, SiteImage>;
export const defaultSiteImages: SiteImages = Object.fromEntries(imageSlots.map(slot => [slot.key, { url: "", alt: slot.alt, active: slot.key !== "contactHero" }]));
export function validImageUrl(value: string) {
  return /^\/(?!\/)[^\s"'()<>\\]*$/.test(value) || /^https:\/\/[^\s"'()<>\\]+$/i.test(value);
}
export function scenicImageStyle(src: string): CSSProperties {
  return { "--page-image": src && validImageUrl(src) ? `url(${JSON.stringify(src)})` : "none" } as CSSProperties;
}
