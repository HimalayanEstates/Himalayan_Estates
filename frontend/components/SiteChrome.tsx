"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import SiteLogo from "./SiteLogo";
import { useSitePage, useSiteSetting } from "@/lib/site-data";

export function Header() {
  const { navigation } = useSitePage<typeof import("@/lib/site-page-defaults").sitePageDefaults.global>("global");
  const [open, setOpen] = useState(false);
  const siteName = useSiteSetting("site.name");

  return (
    <header className="topbar">
      <Link className="brand brand-logo" href="/" aria-label={`${siteName} home`}>
        <SiteLogo name={siteName} priority/>
      </Link>
      <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav id="navigation" className={open ? "nav open" : "nav"}>
        <Link href="/" onClick={() => setOpen(false)}>{navigation.home}</Link>
        <Link href="/properties" onClick={() => setOpen(false)}>{navigation.properties}</Link>
        <Link href="/privacy" onClick={() => setOpen(false)}>{navigation.policies}</Link>
        <Link href="/about" onClick={() => setOpen(false)}>{navigation.about}</Link>
        <Link href="/advisory" onClick={() => setOpen(false)}>{navigation.advisory}</Link>
        <Link className="button gold" href="/contact" onClick={() => setOpen(false)}>{navigation.contact} <ArrowUpRight size={15} /></Link>
      </nav>
    </header>
  );
}

export function Footer() {
  const { navigation, footer } = useSitePage<typeof import("@/lib/site-page-defaults").sitePageDefaults.global>("global");
  const siteName = useSiteSetting("site.name");
  const tagline = useSiteSetting("site.tagline");

  return (
    <footer className="footer">
      <div>
        <Link className="brand brand-logo" href="/" aria-label={`${siteName} home`}><SiteLogo name={siteName}/></Link>
        <p>{tagline}</p>
      </div>
      <div>
        <h3>{footer.collection}</h3>
        <Link href="/properties?category=HOTEL">{footer.hotels}</Link>
        <Link href="/properties?category=LAND">{footer.land}</Link>
        <Link href="/properties?category=HOUSE_VILLA">{footer.homes}</Link>
      </div>
      <div>
        <h3>{footer.begin}</h3>
        <Link href="/contact">{footer.broker}</Link>
        <Link href="/advisory">{navigation.advisory}</Link>
        <Link href="/privacy">{footer.privacy}</Link>
      </div>
      <p className="footer-bottom">© {new Date().getFullYear()} {siteName}. Manali, Himachal Pradesh.<span>{footer.closing}</span></p>
    </footer>
  );
}
