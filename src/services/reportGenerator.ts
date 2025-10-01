import { supabase } from './supabase';

interface ReportData {
  agency: any;
  properties: any[];
  stats: {
    totalProperties: number;
    avgPrice: number;
    totalValue: number;
    availableCount: number;
    soldCount: number;
  };
  byCounty: Record<string, { count: number; avgPrice: number }>;
  byType: Record<string, { count: number; avgPrice: number }>;
  priceRanges: Array<{ label: string; count: number }>;
}

export class ReportGeneratorService {
  async generateReport(agencyId: string, propertyId?: string): Promise<Blob> {
    const data = await this.collectData(agencyId, propertyId);
    const pdfBlob = await this.createPDF(data);
    return pdfBlob;
  }

  private async collectData(agencyId: string, propertyId?: string): Promise<ReportData> {
    console.log('🔍 Collecting report data for agency:', agencyId, 'property:', propertyId);

    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', agencyId)
      .maybeSingle();

    if (agencyError) {
      console.error('Failed to load agency:', agencyError);
    }

    console.log('📊 Agency data:', agency);

    if (!agency) {
      console.error('❌ Agency not found');
      return {
        agency: {},
        properties: [],
        stats: { totalProperties: 0, avgPrice: 0, totalValue: 0, availableCount: 0, soldCount: 0 },
        byCounty: {},
        byType: {},
        priceRanges: [],
      };
    }

    const sitePrefix = agency.site_prefix;
    console.log('🔑 Using site_prefix for properties query:', sitePrefix);

    let propertiesQuery = supabase
      .from('properties')
      .select('*')
      .eq('agency_id', sitePrefix);

    if (propertyId && propertyId !== 'all') {
      propertiesQuery = propertiesQuery.eq('id', propertyId);
    }

    const { data: properties, error: propertiesError } = await propertiesQuery;

    if (propertiesError) {
      console.error('Failed to load properties:', propertiesError);
    }

    console.log('📋 Properties loaded:', properties?.length || 0, 'properties');
    if (properties && properties.length > 0) {
      console.log('Sample property:', properties[0]);
    }

    const stats = this.calculateStats(properties || []);
    const byCounty = this.groupByCounty(properties || []);
    const byType = this.groupByType(properties || []);
    const priceRanges = this.calculatePriceRanges(properties || []);

    console.log('📈 Stats calculated:', stats);

    return {
      agency: agency || {},
      properties: properties || [],
      stats,
      byCounty,
      byType,
      priceRanges,
    };
  }

  private calculateStats(properties: any[]) {
    const totalProperties = properties.length;
    const totalValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
    const avgPrice = totalProperties > 0 ? Math.round(totalValue / totalProperties) : 0;
    const availableCount = properties.filter(p => p.status === 'available').length;
    const soldCount = properties.filter(p => p.status === 'sold').length;

    return {
      totalProperties,
      avgPrice,
      totalValue,
      availableCount,
      soldCount,
    };
  }

  private groupByCounty(properties: any[]) {
    return properties.reduce((acc, prop) => {
      const county = prop.county || 'Unknown';
      if (!acc[county]) {
        acc[county] = { count: 0, avgPrice: 0 };
      }
      acc[county].count++;
      return acc;
    }, {} as Record<string, { count: number; avgPrice: number }>);
  }

  private groupByType(properties: any[]) {
    return properties.reduce((acc, prop) => {
      const type = prop.type || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, avgPrice: 0 };
      }
      acc[type].count++;
      return acc;
    }, {} as Record<string, { count: number; avgPrice: number }>);
  }

  private calculatePriceRanges(properties: any[]) {
    const ranges = [
      { label: '< €100k', min: 0, max: 100000 },
      { label: '€100k - €200k', min: 100000, max: 200000 },
      { label: '€200k - €300k', min: 200000, max: 300000 },
      { label: '€300k - €500k', min: 300000, max: 500000 },
      { label: '> €500k', min: 500000, max: Infinity },
    ];

    return ranges.map(range => ({
      label: range.label,
      count: properties.filter(p => p.price >= range.min && p.price < range.max).length,
    }));
  }

  private async createPDF(data: ReportData): Promise<Blob> {
    const html = this.generateHTML(data);

    const blob = new Blob([html], { type: 'text/html' });
    return blob;
  }

  private generateHTML(data: ReportData): string {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Report - ${data.agency.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
      padding: 40px;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
    }
    .header h1 { font-size: 32px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #111827;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .stat-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #111827;
    }
    .chart-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 12px;
    }
    .chart-label {
      min-width: 120px;
      font-size: 14px;
      font-weight: 500;
    }
    .chart-bar {
      flex: 1;
      height: 32px;
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 4px;
      position: relative;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chart-value {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: white;
      font-size: 12px;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding-top: 40px;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .executive-summary {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .executive-summary h3 {
      color: #1e40af;
      margin-bottom: 12px;
    }
    .insight-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .insight-box strong {
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Property Portfolio Report</h1>
    <p>${data.agency.name || data.agency.site_prefix || 'Agency'} • Generated on ${date}</p>
  </div>

  <div class="executive-summary">
    <h3>Executive Summary</h3>
    <p>
      This comprehensive report provides a detailed analysis of the property portfolio
      for ${data.agency.name || data.agency.site_prefix || 'the selected agency'}. The portfolio consists of ${data.stats.totalProperties} properties
      with a total estimated value of €${data.stats.totalValue.toLocaleString()}.
    </p>
  </div>

  <div class="section">
    <h2>Portfolio Overview</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Properties</div>
        <div class="value">${data.stats.totalProperties}</div>
      </div>
      <div class="stat-card">
        <div class="label">Average Price</div>
        <div class="value">€${data.stats.avgPrice.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Value</div>
        <div class="value">€${(data.stats.totalValue / 1000000).toFixed(1)}M</div>
      </div>
      <div class="stat-card">
        <div class="label">Available</div>
        <div class="value">${data.stats.availableCount}</div>
      </div>
    </div>

    <div class="insight-box">
      <strong>Key Insight:</strong>
      The portfolio shows ${data.stats.availableCount > data.stats.soldCount ? 'strong' : 'moderate'}
      availability with ${Math.round((data.stats.availableCount / data.stats.totalProperties) * 100)}%
      of properties currently available for sale.
    </div>
  </div>

  <div class="section">
    <h2>Properties by Location</h2>
    ${Object.entries(data.byCounty)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([county, info]) => {
        const maxCount = Math.max(...Object.values(data.byCounty).map(v => v.count));
        const width = (info.count / maxCount) * 100;
        return `
        <div class="chart-row">
          <div class="chart-label">${county}</div>
          <div class="chart-bar" style="width: ${width}%">
            <div class="chart-value">${info.count}</div>
          </div>
        </div>
      `}).join('')}
  </div>

  <div class="section">
    <h2>Properties by Type</h2>
    ${Object.entries(data.byType)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([type, info]) => {
        const maxCount = Math.max(...Object.values(data.byType).map(v => v.count));
        const width = (info.count / maxCount) * 100;
        return `
        <div class="chart-row">
          <div class="chart-label">${type}</div>
          <div class="chart-bar" style="width: ${width}%; background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);">
            <div class="chart-value">${info.count}</div>
          </div>
        </div>
      `}).join('')}
  </div>

  <div class="section">
    <h2>Market Analysis</h2>
    <div class="insight-box">
      <strong>Market Position:</strong>
      With an average price of €${data.stats.avgPrice.toLocaleString()},
      the portfolio is positioned in the ${data.stats.avgPrice > 300000 ? 'premium' : 'mid-range'}
      market segment. This provides ${data.stats.avgPrice > 300000 ? 'excellent' : 'strong'}
      opportunities for high-value transactions.
    </div>

    <h3 style="margin-top: 20px; margin-bottom: 12px; font-size: 18px;">Price Distribution</h3>
    ${data.priceRanges.map(range => {
      const maxCount = Math.max(...data.priceRanges.map(r => r.count));
      const width = maxCount > 0 ? (range.count / maxCount) * 100 : 0;
      return `
      <div class="chart-row">
        <div class="chart-label">${range.label}</div>
        <div class="chart-bar" style="width: ${width}%; background: linear-gradient(90deg, #10b981 0%, #059669 100%);">
          <div class="chart-value">${range.count}</div>
        </div>
      </div>
    `}).join('')}
  </div>

  <div class="section">
    <h2>Recommendations</h2>
    <ul style="list-style: none; padding-left: 0;">
      <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
        <span style="position: absolute; left: 0; color: #3b82f6;">•</span>
        Focus on high-demand locations showing strong market activity
      </li>
      <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
        <span style="position: absolute; left: 0; color: #3b82f6;">•</span>
        Consider diversifying property types to capture broader market segments
      </li>
      <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
        <span style="position: absolute; left: 0; color: #3b82f6;">•</span>
        Maintain competitive pricing aligned with local market trends
      </li>
      <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
        <span style="position: absolute; left: 0; color: #3b82f6;">•</span>
        Implement targeted marketing strategies for premium properties
      </li>
    </ul>
  </div>

  <div class="footer">
    <p>This report was automatically generated by 4Property Codes</p>
    <p>For questions or support, please contact your account manager</p>
  </div>
</body>
</html>
    `;
  }
}

export const reportGeneratorService = new ReportGeneratorService();
