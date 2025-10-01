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

    const url = `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${sitePrefix}-${siteId}.xml`;
    console.log('Fetching Acquaint feed:', url);
    const response = await axios.get(url, { responseType: 'text' });
    return response.data;
  }

  private async getPropertyDataFromApi(sitePrefix: string, siteId: number | string = 0) {
    try {
      const xmlText = await this.fetchAcquaintXml(sitePrefix, siteId);

      const parser = new XMLParser({ ignoreAttributes: false });
      const json = parser.parse(xmlText);

      const properties = json?.Properties?.Property || [];

      return properties.map((p: any, idx: number) => ({
        id: p.ID || p.PropertyID || idx,
        title: p.Address1 || p.Address || 'No Address',
        address: p.Address1 || p.Address || '',
        city: p.Town || p.City || 'Unknown',
        county: p.County || '',
        country: 'Ireland',
        price: Number(p.Price) || 0,
        bedrooms: p.Bedrooms || null,
        bathrooms: p.Bathrooms || null,
        type: p.Type || p.PropertyType || 'Unknown',
        status: p.Status || 'active',
        description: p.Description || '',
        images: Array.isArray(p.Images?.Image)
          ? p.Images.Image.map((img: any) => img.Url || img)
          : p.Images?.Image?.Url
          ? [p.Images.Image.Url]
          : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to fetch Acquaint data:', error);
      throw new Error('Nezdarilo se nacist data o nemovitostech z Acquaint API');
    }
  }

  async getPropertiesForAgency(agencyId: string) {
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
    return this.getPropertyDataFromApi(source.sitePrefix, siteId);
  }
}

export const apiService = new ApiService();
export default apiService;