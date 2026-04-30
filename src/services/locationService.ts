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
    if (!mid) {
      // Return mock data fallback if no mid is provided
      return import('../data').then(m => m.LOCATIONS);
    }

    try {
      // Use local proxy to bypass CORS
      const response = await fetch(`/api/kml?mid=${mid}`);
      if (!response.ok) throw new Error('Proxy error');
      const kmlText = await response.text();
      
      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(kmlText, 'text/xml');
      const geoJson = kml(kmlDom);

      const locations: Location[] = geoJson.features.map((feature: any, index: number) => {
        // Map MyMaps layers to our Categories
        // Layers in MyMaps are often represented as 'Folder' names in KML
        // togeojson flattens them, but we can look at feature properties
        
        let category: Category = 'Branch';
        const layerName = feature.properties?.['_layer'] || ''; // Some parsers include layer name
        
        if (layerName.includes('ATM')) category = 'ATM';
        if (layerName.includes('24/7')) category = '24/7';

        return {
          id: `dynamic-${index}`,
          name: feature.properties?.name || 'Unknown Location',
          address: feature.properties?.description || feature.properties?.address || 'No address provided',
          category,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          photo: this.extractPhoto(feature.properties?.description) || this.defaultPhoto,
        };
      });

      return locations;
    } catch (error) {
      console.error('Failed to fetch dynamic map data:', error);
      // Fallback to static data if fetch fails
      return import('../data').then(m => m.LOCATIONS);
    }
  }

  private static extractPhoto(description?: string): string | null {
    if (!description) return null;
    // Basic regex to find image URLs in MyMap descriptions
    const imgRegex = /src="([^"]+)"|href="([^"]+\.(?:jpg|png|jpeg|gif))"/i;
    const match = description.match(imgRegex);
    return match ? (match[1] || match[2]) : null;
  }
}
