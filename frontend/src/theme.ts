export const theme = {
  dark: {
    surface: '#0A0A0A',
    onSurface: '#F7F7F7',
    surfaceSecondary: '#151515',
    onSurfaceSecondary: '#A3A3A3',
    surfaceTertiary: '#1C1C1C',
    onSurfaceTertiary: '#737373',
    brand: '#D4AF37',
    brandPrimary: '#D4AF37',
    onBrandPrimary: '#1A1500',
    brandSecondary: '#B8952B',
    brandTertiary: '#332A0D',
    onBrandTertiary: '#E6CC80',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#64B5F6',
    border: '#262626',
    borderStrong: '#404040',
    divider: '#1F1F1F',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: { sm: 4, md: 8, lg: 16, pill: 999 },
  font: {
    display: 'serif', // Georgia (iOS) / serif (Android) - luxe fallback
    displayReg: 'serif',
    text: 'System',
  },
  fontSize: { sm: 12, base: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40 },
};

export const KARATS = ['9K', '10K', '12K', '14K', '18K', '20K', '22K', '24K'];
export const STAGES = [
  'Order Received', 'Designing', 'CAD Approval', 'Casting', 'Filing',
  'Pre Polish', 'Stone Setting', 'Final Polish', 'Quality Check',
  'Packing', 'Ready', 'Delivered',
];
export const JEWELLERY_TYPES = ['Ring', 'Pendant', 'Chain', 'Necklace', 'Bracelet', 'Bangle', 'Earrings', 'Custom'];
export const CLIENT_TYPES = ['Wholesaler', 'Retail', 'Supplier'];

export const fmtWeight = (g: number) => `${(g ?? 0).toFixed(3)} g`;
export const fmtMoney = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
export const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};
