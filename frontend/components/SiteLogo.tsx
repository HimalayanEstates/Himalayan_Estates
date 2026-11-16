export default function SiteLogo({ name = 'Himalayan Estates', priority = false }: { name?: string; priority?: boolean }) {
  return <img className="site-logo-image" src="/images/himalayan-estates-logo.png" alt={`${name} — Manali, Himachal Pradesh`} width={669} height={373} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"/>;
}
