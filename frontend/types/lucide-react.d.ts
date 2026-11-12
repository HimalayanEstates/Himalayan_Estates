declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';

  type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

  export const ArrowUpRight: Icon;
  export const ArrowLeft: Icon;
  export const BedDouble: Icon;
  export const Building2: Icon;
  export const Check: Icon;
  export const ChevronDown: Icon;
  export const Compass: Icon;
  export const Heart: Icon;
  export const Hotel: Icon;
  export const LandPlot: Icon;
  export const MapPin: Icon;
  export const Menu: Icon;
  export const Search: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const Trees: Icon;
  export const X: Icon;
}
