"use client";
import { Header, Footer } from "@/components/SiteChrome";
import '@/components/advisory-guide.css';
import { scenicImageStyle } from "@/lib/site-images";
import { useSiteImages, useSitePage } from "@/lib/site-data";
import { sitePageDefaults } from "@/lib/site-page-defaults";
export default function PrivacyPage() {
 const image=useSiteImages();
 const content = useSitePage<typeof sitePageDefaults.privacy>("privacy");
 const advisory = content.section118;
 return <><Header/><main id="main-content" className="privacy-page"><section className="privacy-hero" style={scenicImageStyle(image("privacyHero").src)}><p className="eyebrow">{content.hero.eyebrow}</p><h1>{content.hero.title}</h1><p>{content.hero.intro}</p></section><section id="section-118" className="section118-preview legal-container"><p className="eyebrow">{advisory.eyebrow}</p><h2>{advisory.title}</h2><p>{advisory.intro}</p><div className="section118-preview-grid"><div><h3>{advisory.documentsTitle}</h3><p>{advisory.documentsBody}</p></div><div><h3>{advisory.processTitle}</h3><ol>{advisory.steps.map((step,index)=><li key={index}>{step}</li>)}</ol></div></div><p className="advisory-note">{advisory.disclaimer}</p><a className="button" href="/advisory">{advisory.linkLabel}</a></section><article className="privacy-content"><h2 className="privacy-policy-title">{content.policy.title}</h2><p className="privacy-updated">Last updated: {content.policy.updated}</p>{content.policy.sections.map((section, index) => <section key={index}><h2>{section.title}</h2><p>{section.body}</p></section>)}</article></main><Footer/></>;
}
