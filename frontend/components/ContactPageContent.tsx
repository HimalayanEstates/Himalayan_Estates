"use client";

import { Header, Footer } from "@/components/SiteChrome";
import InquiryForm from "@/components/InquiryForm";
import { sitePageDefaults } from "@/lib/site-page-defaults";
import { scenicImageStyle } from "@/lib/site-images";
import { useSiteImages, useSitePage, useSiteSetting } from "@/lib/site-data";

export default function ContactPageContent() {
  const image=useSiteImages();
  const content = useSitePage<typeof sitePageDefaults.contact>("contact");
  const brokerName = useSiteSetting("contact.name");
  const phone = useSiteSetting("contact.phone");
  const email = useSiteSetting("contact.email");
  const address = useSiteSetting("contact.address");
  const whatsapp = `https://wa.me/${phone.replace(/\D/g, "")}`;
  const telephone = phone.replace(/[^\d+]/g, "");

  return (
    <>
      <Header />
      <main id="main-content">
        <section className="section service-section" aria-labelledby="services-title">
          <p className="eyebrow">{content.services.eyebrow}</p>
          <h1 id="services-title">{content.services.title}</h1>
          <p className="service-intro">{content.services.intro}</p>
          <div className="service-grid">
            {content.services.items.map((service, index) => (
              <a className="service-card" key={`${service.title}-${index}`} href={`${whatsapp}?text=${encodeURIComponent(`Hello, I would like to discuss ${service.title.toLowerCase()} in Manali.`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Enquire about ${service.title} on WhatsApp (opens a new tab)`}>
                <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="broker-contact scenic-contact" style={scenicImageStyle(image("contactHero").src)} aria-labelledby="broker-contact-title">
          <div>
            <p className="eyebrow">{content.contact.eyebrow}</p>
            <h2 id="broker-contact-title">{content.contact.title}</h2>
            <p>{content.contact.intro}</p>
            <a className="button gold" href={whatsapp} target="_blank" rel="noopener noreferrer">Chat on WhatsApp<span className="sr-only"> (opens a new tab)</span></a>
          </div>
          <address className="broker-contact-panel">
            <h3>Contact {brokerName}</h3>
            <p>{address}</p>
            {telephone && <a href={`tel:${telephone}`}>{phone}</a>}
            {email && <p><a href={`mailto:${email}`}>{email}</a></p>}
            <p>WhatsApp: <a href={whatsapp} target="_blank" rel="noopener noreferrer">Message now<span className="sr-only"> (opens a new tab)</span></a></p>
            <p className="broker-note">{content.contact.note}</p>
          </address>
        </section>
        <InquiryForm />
      </main>
      <Footer />
    </>
  );
}
