import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

import agencyDetails from '../../public/GetAgency.json';
import acquaintSources from '../../public/A-data.json';

type RawAgency = typeof agencyDetails[number];
type RawAcquaintSource = typeof acquaintSources[number];

type NormalizedAgency = RawAgency & {
  id: number;
  UUID: string;
  Key: string;
  unique_key: string;
  name: string;
  Name: string;
  logo: string | null;
  Logo: string | null;
  sitePrefix: string | null;
  siteId: number;
  acquaintSource: {
    sitePrefix: string;
    siteId: number;
    url?: string;
  } | null;
};

class ApiService {
  private cachedAgencies: NormalizedAgency[] | null = null;

  async login(email: string, password: string) {
    console.log('🔐 Login attempt:', { email });

    if (email === 'tech@4pm.ie' && password === 'password') {
      const token = 'demo-token-' + Date.now();
      localStorage.setItem('auth_token', token);
      return { token, user: { email } };
    }

    throw new Error('Invalid credentials');
  }

  private normalizeAgencies(): NormalizedAgency[] {
    if (this.cachedAgencies) {
      return this.cachedAgencies;
    }

    const acquaintMap = new Map<string, RawAcquaintSource>();
    acquaintSources.forEach((entry) => {
      if (entry?.SitePrefix) {
        acquaintMap.set(entry.SitePrefix.toLowerCase(), entry);
      }
    });

    const deduped = new Map<string, NormalizedAgency>();

    agencyDetails.forEach((rawAgency: RawAgency, index: number) => {
      const maybePrefix =
        (rawAgency as any)?.sitePrefix ||
        (rawAgency as any)?.SitePrefix ||
        rawAgency?.AcquiantCustomer?.SitePrefix ||
        null;

      const fallbackKey = maybePrefix || (rawAgency as any)?.Key || `agency-${index}`;
      const normalizedKey = String(fallbackKey || '').trim();
      if (!normalizedKey) {
        return;
      }

      const existing = deduped.get(normalizedKey);

      const matchedSource = maybePrefix
        ? acquaintMap.get(String(maybePrefix).toLowerCase())
        : undefined;

      const logoValue =
        (rawAgency as any)?.logo ??
        (rawAgency as any)?.Logo ??
        existing?.logo ??
        existing?.Logo ??
        null;

      const nameValue =
        (rawAgency as any)?.name ??
        (rawAgency as any)?.Name ??
        (rawAgency as any)?.OfficeName ??
        existing?.name ??
        existing?.Name ??
        normalizedKey;

      const sitePrefixValue = maybePrefix ?? existing?.sitePrefix ?? null;
      const siteIdValue =
        (rawAgency as any)?.SiteID ??
        rawAgency?.AcquiantCustomer?.SiteID ??
        matchedSource?.SiteID ??
        existing?.siteId ??
        0;

      const agency: NormalizedAgency = {
        ...(existing ?? {}),
        ...(rawAgency as any),
        id: (rawAgency as any)?.id ?? existing?.id ?? index,
        UUID:
          (rawAgency as any)?.UUID ??
          (rawAgency as any)?.uuid ??
          existing?.UUID ??
          normalizedKey,
        Key:
          (rawAgency as any)?.Key ??
          existing?.Key ??
          normalizedKey,
        unique_key:
          (rawAgency as any)?.unique_key ??
          existing?.unique_key ??
          normalizedKey,
        name: nameValue,
        Name: nameValue,
        logo: logoValue,
        Logo: logoValue,
        sitePrefix: sitePrefixValue,
        siteId: siteIdValue,
        acquaintSource: sitePrefixValue
          ? {
              sitePrefix: sitePrefixValue,
              siteId: siteIdValue ?? 0,
              url: matchedSource?.url,
            }
          : existing?.acquaintSource ?? null,
      };

      deduped.set(normalizedKey, agency);
    });

    this.cachedAgencies = Array.from(deduped.values());
    return this.cachedAgencies;
  }

  async getAgencies() {
    return this.normalizeAgencies();
  }

  async getAgency(id: string) {
    const agencies = await this.getAgencies();
    const normalizedId = String(id ?? '').trim().toLowerCase();
    if (!normalizedId) {
      return undefined;
    }

    return agencies.find((agency) => {
      const candidates = [
        agency.Key,
        agency.unique_key,
        agency.UUID,
        agency.sitePrefix,
        (agency as any)?.SitePrefix,
      ];

      return candidates.some((candidate) => {
        if (candidate === undefined || candidate === null) return false;
        return String(candidate).trim().toLowerCase() === normalizedId;
      });
    });
  }

  private async fetchAcquaintXml(sitePrefix: string, siteId: number | string = 0) {
    if (typeof window !== 'undefined' && window.electron?.fetchAcquaintData) {
      return window.electron.fetchAcquaintData(sitePrefix, siteId);
    }

    const filename = `${sitePrefix}-${siteId}.xml`;
    const proxyUrl = `http://localhost:3001/acquaint/datafeeds/standardxml/${filename}`;

    console.log('Fetching Acquaint feed via proxy:', proxyUrl);

    try {
      const response = await axios.get(proxyUrl, {
        responseType: 'text',
        headers: {
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      console.log(`✅ Successfully fetched ${filename} (${response.data.length} bytes)`);

      const blob = new Blob([response.data], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch ${filename}:`, error.message);
      throw error;
    }
  }

  private async getPropertyDataFromApi(sitePrefix: string, siteId: number | string = 0) {
    try {
      const xmlText = await this.fetchAcquaintXml(sitePrefix, siteId);

      const parser = new XMLParser({ ignoreAttributes: false });
      const json = parser.parse(xmlText);

      const properties = json?.data?.properties?.property || [];
      const propsArray = Array.isArray(properties) ? properties : [properties];

      return propsArray.map((p: any) => {
        const images: string[] = [];

        if (p.pictures) {
          for (let i = 1; i <= 20; i++) {
            const picKey = `picture${i}`;
            if (p.pictures[picKey]) {
              images.push(p.pictures[picKey]);
            }
          }
        }

        return {
          id: p.id || p.uniquereferencenumber || Math.random().toString(36),
          title: p.displayaddress || p.address?.street || 'No Address',
          address: p.address?.street || p.displayaddress || '',
          city: p.address?.town || 'Unknown',
          county: p.address?.region || '',
          country: 'Ireland',
          price: Number(p.price) || 0,
          bedrooms: Number(p.bedrooms) || null,
          bathrooms: Number(p.bathrooms) || null,
          type: p.type || 'Unknown',
          status: p.status || 'active',
          description: p.descriptionfull || p.descriptionbrief || '',
          images: images,
          created_at: p.addeddate || new Date().toISOString(),
          updated_at: p.updateddate || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Failed to fetch Acquaint data:', error);
      throw new Error('Nezdarilo se nacist data o nemovitostech z Acquaint API');
    }
  }

  async getPropertiesForAgency(agencyId: string, forceRefresh: boolean = false) {
    const agency = await this.getAgency(agencyId);
    if (!agency) {
      throw new Error(`Agentura ${agencyId} nebyla nalezena`);
    }

    const source = agency.acquaintSource;
    if (!source || !source.sitePrefix) {
      console.warn(`Agency ${agencyId} nema definovany Acquaint feed`);
      return [];
    }

    const siteId = source.siteId ?? 0;

    try {
      return await this.getPropertyDataFromApi(source.sitePrefix, siteId);
    } catch (error) {
      console.warn(`API fetch failed for agency ${agencyId}, trying fallback data...`);
      return await this.loadPropertiesFromJson();
    }
  }

  private async loadPropertiesFromJson(): Promise<Property[]> {
    try {
      const response = await fetch('/A-data.json');
      if (!response.ok) {
        console.warn('A-data.json not found');
        return [];
      }

      const data = await response.json();
      const propertiesData = data.find((item: any) => item.type === 'table')?.data || [];

      return propertiesData.map((p: any) => ({
        id: p.id || `prop-${Date.now()}-${Math.random()}`,
        agency_id: p.agency_id || 'unknown',
        title: p.title || 'Untitled Property',
        address: p.address || '',
        city: p.city || '',
        postcode: p.postcode || '',
        price: Number(p.price) || 0,
        bedrooms: Number(p.bedrooms) || null,
        bathrooms: Number(p.bathrooms) || null,
        type: p.type || 'Unknown',
        status: p.status || 'active',
        description: p.description || '',
        images: p.images || [],
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to load properties from JSON:', error);
      return [];
    }
  }
}

export const apiService = new ApiService();
export default apiService;