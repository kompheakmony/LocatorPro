import { Location, Category } from '../types';
import { kml } from '@tmcw/togeojson';

/**
 * Service to fetch and parse Google My Maps KML data.
 * NOTE: Fetching directly from Google My Maps in the browser often hits CORS issues.
 * A server-side proxy or a Google Apps Script is usually recommended.
 */
export class LocationService {
  private static defaultPhoto = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400';

  static async fetchLocations(mid?: string): Promise<Location[]> {
    console.log(`[LocationService] fetchLocations called with MID: ${mid}`);
    if (!mid || mid.trim() === '') {
      console.log(`[LocationService] No MID provided, using static fallback data.`);
      const { LOCATIONS } = await import('../data');
      return LOCATIONS;
    }

    try {
      const response = await fetch(`/api/kml?mid=${mid}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch map data: ${response.status} ${errorData.error || ''}`);
      }
      
      const kmlText = await response.text();
      console.log(`[LocationService] KML received, length: ${kmlText.length}`);
      
      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(kmlText, 'text/xml');
      
      const parseError = kmlDom.querySelector('parsererror');
      if (parseError) {
        console.error(`[LocationService] DOMParser error:`, parseError.textContent);
        throw new Error('Failed to parse KML data');
      }

      const locations: Location[] = [];
      const folders = Array.from(kmlDom.getElementsByTagName('Folder'));
      
      console.log(`[LocationService] Found ${folders.length} folders in KML`);

      if (folders.length > 0) {
        folders.forEach((folder, fIndex) => {
          const folderName = folder.getElementsByTagName('name')[0]?.textContent || '';
          
          let category: Category = 'Branch';
          const lowerFolderName = folderName.toLowerCase();
          if (lowerFolderName.includes('atm')) category = 'ATM';
          if (lowerFolderName.includes('24/7')) category = '24/7';

          const placemarks = Array.from(folder.getElementsByTagName('Placemark'));
          placemarks.forEach((placemark, pIndex) => {
            const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Unnamed Location';
            
            const coordsNode = placemark.getElementsByTagName('coordinates')[0];
            if (!coordsNode || !coordsNode.textContent) return;
            
            const [lng, lat] = coordsNode.textContent.trim().split(',').map(Number);
            if (isNaN(lng) || isNaN(lat)) return;

            const properties: Record<string, string> = { name };
            const dataNodes = Array.from(placemark.getElementsByTagName('Data'));
            dataNodes.forEach(node => {
              const dName = node.getAttribute('name');
              const dValue = node.getElementsByTagName('value')[0]?.textContent;
              if (dName && dValue) properties[dName] = dValue;
            });

            const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
            const rawPhoto = properties.gx_media_links || 
                             this.extractPhoto(description) || 
                             properties.photo || // Some KMLs use other field names
                             this.defaultPhoto;
            
            let photo = typeof rawPhoto === 'string' ? rawPhoto.split(/[\n,]/)[0].trim() : String(rawPhoto);
            
            // Handle Drive links
            if (photo.includes('drive.google.com/file/d/')) {
              const driveId = photo.match(/\/d\/([^\/]+)/)?.[1];
              if (driveId) photo = `https://lh3.googleusercontent.com/u/0/d/${driveId}`;
            }

            // Handle My Maps hosted images or Google User Content - proxy via server to bypass NotSameSite
            if (photo.includes('mymaps.usercontent.google.com') || photo.includes('googleusercontent.com/hostedimage')) {
              photo = `/api/image?url=${encodeURIComponent(photo)}`;
            }

            const address = properties.address || properties.description || description || 'No address provided';
            const cleanAddress = typeof address === 'string' 
              ? address.replace(/<[^>]*>/g, '').split('description:')[0].trim() 
              : address;

            locations.push({
              id: `dyn-${fIndex}-${pIndex}`,
              name,
              address: cleanAddress,
              category,
              lat,
              lng,
              photo,
            });
          });
        });
      }

      if (locations.length === 0) {
        console.log(`[LocationService] No locations found in folders, trying flat parsing...`);
        const allPlacemarks = Array.from(kmlDom.getElementsByTagName('Placemark'));
        allPlacemarks.forEach((placemark, index) => {
          const name = placemark.getElementsByTagName('name')[0]?.textContent || `Location ${index + 1}`;
          const coords = placemark.getElementsByTagName('coordinates')[0]?.textContent?.trim().split(',').map(Number);
          if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;

          const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
          let photo = this.extractPhoto(description) || this.defaultPhoto;

          if (photo.includes('mymaps.usercontent.google.com') || photo.includes('googleusercontent.com/hostedimage')) {
            photo = `/api/image?url=${encodeURIComponent(photo)}`;
          }

          locations.push({
            id: `dyn-flat-${index}`,
            name,
            address: description.replace(/<[^>]*>/g, '').substring(0, 100).trim() || 'No description',
            category: 'Branch',
            lat: coords[1],
            lng: coords[0],
            photo,
          });
        });
      }

      return locations;
    } catch (error) {
      console.error('[LocationService] Error in fetchLocations:', error);
      throw error;
    }
  }

  private static extractPhoto(description?: string): string | null {
    if (!description) return null;
    
    // 1. Look for <img> tags
    const imgRegex = /src="([^"]+)"/i;
    const match = description.match(imgRegex);
    if (match && match[1]) return match[1];

    // 2. Look for hrefs that look like images
    const linkRegex = /href="([^"]+\.(?:jpg|png|jpeg|gif|webp)(?:\?[^"]*)?)"/i;
    const linkMatch = description.match(linkRegex);
    if (linkMatch && linkMatch[1]) return linkMatch[1];

    // 3. Look for hostedimage URLs in plain text
    const hostedRegex = /(https:\/\/mymaps\.usercontent\.google\.com\/hostedimage\/[^\s<>"]+)/i;
    const hostedMatch = description.match(hostedRegex);
    if (hostedMatch && hostedMatch[1]) return hostedMatch[1];

    return null;
  }
}
