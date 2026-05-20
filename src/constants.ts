export const BRAND_CONFIG = {
  name: 'Locate360',
  categories: {
    'Branch': { label: 'Branches', short: 'BRCH' },
    '24/7': { label: 'Self-Service', short: '24/7' },
    'ATM': { label: 'ATMs', short: 'ATMS' }
  },
  colors: {
    primary: '#003B5C',
    secondary: '#00ADC6',
    accent: '#00ADC6',
  }
};

export function getProxyImageUrl(photoUrl: string): string {
  if (!photoUrl) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400';
  }
  
  // If already proxied, return as-is
  if (photoUrl.startsWith('https://wsrv.nl/') || photoUrl.startsWith('/api/image')) {
    return photoUrl;
  }

  if (
    photoUrl.includes('mymaps.usercontent.google.com') || 
    photoUrl.includes('googleusercontent.com/hostedimage') ||
    photoUrl.includes('googleusercontent.com')
  ) {
    // wsrv.nl is an extremely reliable global image proxy that handles all same-site/CORS constraints on the client-side
    return `https://wsrv.nl/?url=${encodeURIComponent(photoUrl)}`;
  }
  
  return photoUrl;
}

