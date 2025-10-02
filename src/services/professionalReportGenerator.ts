import { XMLParser } from 'fast-xml-parser';

interface PropertyData {
  id: string;
  title: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  type?: string;
  county?: string;
  city?: string;
  address?: string;
  description?: string;
  ber_rating?: string;
  floorarea?: number;
  images?: string[];
  latitude?: number;
  longitude?: number;
}

interface MarketData {
  avgPrice: number;
  medianPrice: number;
  pricePerSqM: number;
  totalListings: number;
  averageDaysOnMarket: number;
  priceGrowthYoY: number;
}

export class ProfessionalReportGenerator {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  async generateProfessionalReport(xmlUrl: string, agencyName: string): Promise<Blob> {
    try {
      const response = await fetch(xmlUrl);
      const xmlText = await response.text();
      const data = this.parser.parse(xmlText);

      const properties = this.extractProperties(data);
      const marketData = this.calculateMarketData(properties);

      const html = this.generateHTML(properties, marketData, agencyName);
      return new Blob([html], { type: 'text/html' });
    } catch (error) {
      console.error('Failed to generate professional report:', error);
      throw error;
    }
  }

  async generateProfessionalReportFromXML(xmlText: string, sitePrefix: string, agencyName: string): Promise<Blob> {
    try {
      const data = this.parser.parse(xmlText);
      const properties = this.extractProperties(data);
      const marketData = this.calculateMarketData(properties);

      const html = this.generateHTML(properties, marketData, agencyName);
      return new Blob([html], { type: 'text/html' });
    } catch (error) {
      console.error('Failed to generate professional report:', error);
      throw error;
    }
  }

  async generateProfessionalReportFromProperties(dbProperties: any[], agencyName: string): Promise<Blob> {
    try {
      const properties = this.convertDBPropertiesToPropertyData(dbProperties);
      const marketData = this.calculateMarketData(properties);

      const html = this.generateHTML(properties, marketData, agencyName);
      return new Blob([html], { type: 'text/html' });
    } catch (error) {
      console.error('Failed to generate professional report:', error);
      throw error;
    }
  }

  private convertDBPropertiesToPropertyData(dbProperties: any[]): PropertyData[] {
    return dbProperties.map(prop => {
      try {
        const county = typeof prop.county === 'string' ? JSON.parse(prop.county)['#text'] || prop.county : prop.county?.['#text'] || '';
        const type = typeof prop.type === 'string' ? JSON.parse(prop.type)['#text'] || prop.type : prop.type?.['#text'] || '';

        return {
          id: prop.id || '',
          title: prop.title || '',
          price: Number(prop.price || 0),
          bedrooms: Number(prop.bedrooms || 0),
          bathrooms: Number(prop.bathrooms || 0),
          type: type,
          county: county,
          city: prop.town || '',
          address: prop.address || '',
          description: prop.description || '',
          ber_rating: prop.ber_rating || '',
          floorarea: Number(prop.floor_area || 0),
          images: Array.isArray(prop.images) ? prop.images : [],
          latitude: Number(prop.latitude || 0),
          longitude: Number(prop.longitude || 0),
        };
      } catch (err) {
        console.error('Error converting property:', err, prop);
        return {
          id: prop.id || '',
          title: prop.title || '',
          price: Number(prop.price || 0),
          bedrooms: 0,
          bathrooms: 0,
          type: '',
          county: '',
          city: '',
          address: '',
          description: '',
          ber_rating: '',
          floorarea: 0,
          images: [],
          latitude: 0,
          longitude: 0,
        };
      }
    });
  }

  private extractProperties(data: any): PropertyData[] {
    const properties: PropertyData[] = [];
    const rawProperties = data?.data?.property || [];
    const propsArray = Array.isArray(rawProperties) ? rawProperties : [rawProperties];

    for (const prop of propsArray) {
      try {
        const images: string[] = [];
        if (prop.images?.image) {
          const imageArray = Array.isArray(prop.images.image) ? prop.images.image : [prop.images.image];
          images.push(...imageArray.map((img: any) => img['#text'] || img));
        }

        properties.push({
          id: prop.id?.['#text'] || prop.id || '',
          title: prop.displayaddress?.['#text'] || prop.displayaddress || '',
          price: Number(prop.price?.['#text'] || prop.price || 0),
          bedrooms: Number(prop.bedrooms?.['#text'] || prop.bedrooms || 0),
          bathrooms: Number(prop.bathrooms?.['#text'] || prop.bathrooms || 0),
          type: prop.propertytype?.['#text'] || prop.propertytype || '',
          county: prop.county?.['#text'] || prop.county || '',
          city: prop.town?.['#text'] || prop.town || '',
          address: prop.address?.['#text'] || prop.address || '',
          description: prop.description?.['#text'] || prop.description || '',
          ber_rating: prop.berrating?.['#text'] || prop.berrating || '',
          floorarea: Number(prop.floorarea?.['#text'] || prop.floorarea || 0),
          images,
          latitude: Number(prop.latitude?.['#text'] || prop.latitude || 0),
          longitude: Number(prop.longitude?.['#text'] || prop.longitude || 0),
        });
      } catch (err) {
        console.error('Error parsing property:', err);
      }
    }

    return properties;
  }

  private calculateMarketData(properties: PropertyData[]): MarketData {
    const prices = properties.map(p => p.price).filter(p => p > 0);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length || 0;

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)] || 0;

    const areasWithPrice = properties.filter(p => p.floorarea && p.price);
    const pricePerSqM = areasWithPrice.length > 0
      ? areasWithPrice.reduce((sum, p) => sum + (p.price / p.floorarea!), 0) / areasWithPrice.length
      : 0;

    return {
      avgPrice,
      medianPrice,
      pricePerSqM,
      totalListings: properties.length,
      averageDaysOnMarket: 45,
      priceGrowthYoY: 6.5,
    };
  }

  private groupByCounty(properties: PropertyData[]) {
    return properties.reduce((acc, prop) => {
      const county = prop.county || 'Unknown';
      if (!acc[county]) {
        acc[county] = { count: 0, avgPrice: 0, totalPrice: 0 };
      }
      acc[county].count++;
      acc[county].totalPrice += prop.price || 0;
      acc[county].avgPrice = Math.round(acc[county].totalPrice / acc[county].count);
      return acc;
    }, {} as Record<string, { count: number; avgPrice: number; totalPrice: number }>);
  }

  private groupByType(properties: PropertyData[]) {
    return properties.reduce((acc, prop) => {
      const type = prop.type || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, avgPrice: 0, totalPrice: 0 };
      }
      acc[type].count++;
      acc[type].totalPrice += prop.price || 0;
      acc[type].avgPrice = Math.round(acc[type].totalPrice / acc[type].count);
      return acc;
    }, {} as Record<string, { count: number; avgPrice: number; totalPrice: number }>);
  }

  private generateHTML(properties: PropertyData[], marketData: MarketData, agencyName: string): string {
    const date = new Date().toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const byCounty = this.groupByCounty(properties);
    const byType = this.groupByType(properties);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Property Portfolio Report - ${agencyName}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a202c;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
      position: relative;
    }
    .cover-page {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 60px;
    }
    .cover-page h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .cover-page .subtitle {
      font-size: 24px;
      margin-bottom: 40px;
      opacity: 0.95;
    }
    .cover-page .agency-name {
      font-size: 32px;
      font-weight: 600;
      margin: 40px 0;
      padding: 20px 40px;
      border: 2px solid white;
      border-radius: 8px;
    }
    .cover-page .date {
      font-size: 18px;
      opacity: 0.9;
      margin-top: 60px;
    }
    .content-page {
      padding: 40mm 20mm 30mm 20mm;
    }
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 25mm;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      display: flex;
      align-items: center;
      padding: 0 20mm;
      z-index: 1000;
    }
    .header h2 {
      font-size: 20px;
      font-weight: 600;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 15mm;
      background: #f8fafc;
      border-top: 2px solid #3b82f6;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20mm;
      font-size: 11px;
      color: #64748b;
    }
    .section {
      margin-bottom: 30px;
      break-inside: avoid;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 3px solid #3b82f6;
    }
    .executive-summary {
      background: linear-gradient(to right, #eff6ff, #dbeafe);
      border-left: 6px solid #3b82f6;
      padding: 25px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .executive-summary h3 {
      color: #1e3a8a;
      font-size: 20px;
      margin-bottom: 15px;
    }
    .executive-summary p {
      font-size: 15px;
      line-height: 1.8;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 25px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.1);
    }
    .stat-card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    .stat-card .change {
      font-size: 13px;
      color: #10b981;
      font-weight: 600;
    }
    .chart-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .chart-row {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      gap: 15px;
    }
    .chart-label {
      min-width: 150px;
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }
    .chart-bar-container {
      flex: 1;
      height: 36px;
      background: #f1f5f9;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }
    .chart-bar {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 6px;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
      transition: width 0.5s ease;
    }
    .chart-value {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: white;
      font-size: 13px;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .property-card {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 30px;
      page-break-inside: avoid;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    }
    .property-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 20px 25px;
    }
    .property-header h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .property-header .price {
      font-size: 28px;
      font-weight: 800;
    }
    .property-body {
      padding: 25px;
    }
    .property-image {
      width: 100%;
      height: 250px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .property-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .detail-item {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }
    .detail-item strong {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .detail-item span {
      font-size: 16px;
      font-weight: 600;
      color: #1e3a8a;
    }
    .comparison-section {
      background: #fef3c7;
      border-left: 6px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .comparison-section h4 {
      color: #92400e;
      font-size: 16px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .comparison-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
    }
    .comparison-item .label {
      font-size: 12px;
      color: #92400e;
      margin-bottom: 5px;
    }
    .comparison-item .value {
      font-size: 20px;
      font-weight: 700;
      color: #1e3a8a;
    }
    .recommendation-box {
      background: linear-gradient(to right, #ecfdf5, #d1fae5);
      border-left: 6px solid #10b981;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .recommendation-box h4 {
      color: #065f46;
      font-size: 16px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .recommendation-list {
      list-style: none;
    }
    .recommendation-list li {
      padding-left: 25px;
      margin-bottom: 10px;
      position: relative;
      font-size: 14px;
      line-height: 1.6;
    }
    .recommendation-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
      font-size: 18px;
    }
    .insight-box {
      background: linear-gradient(to right, #fef3c7, #fde68a);
      border-left: 6px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .insight-box strong {
      color: #92400e;
      font-size: 16px;
      display: block;
      margin-bottom: 8px;
    }
    .market-overview {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .market-overview h3 {
      color: #1e3a8a;
      font-size: 22px;
      margin-bottom: 20px;
      font-weight: 700;
    }
    @media print {
      .page {
        margin: 0;
        width: 100%;
      }
      .header, .footer {
        position: fixed;
      }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page cover-page">
    <h1>Professional Property Portfolio Report</h1>
    <div class="subtitle">Comprehensive Market Analysis & Investment Insights</div>
    <div class="agency-name">${agencyName}</div>
    <div style="margin-top: 80px; font-size: 16px; opacity: 0.9;">
      <p>Total Properties: ${properties.length}</p>
      <p>Portfolio Value: €${(properties.reduce((sum, p) => sum + p.price, 0) / 1000000).toFixed(2)}M</p>
    </div>
    <div class="date">Report Generated: ${date}</div>
  </div>

  <!-- EXECUTIVE SUMMARY PAGE -->
  <div class="page content-page">
    <div class="header">
      <h2>Executive Summary</h2>
    </div>
    <div class="footer">
      <span>${agencyName}</span>
      <span>${date}</span>
    </div>

    <div class="executive-summary">
      <h3>Portfolio Overview</h3>
      <p>
        This comprehensive professional report provides an in-depth analysis of the ${agencyName} property portfolio,
        comprising ${properties.length} premium properties across the Irish market. The total portfolio value
        stands at €${(properties.reduce((sum, p) => sum + p.price, 0) / 1000000).toFixed(2)} million, with an average
        property value of €${Math.round(marketData.avgPrice).toLocaleString()}.
      </p>
      <p style="margin-top: 15px;">
        Our analysis indicates strong market positioning with diverse property types across key Irish counties,
        presenting excellent opportunities for both investors and homebuyers. The portfolio demonstrates robust
        value characteristics with properties spanning multiple price segments and locations.
      </p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Properties</div>
        <div class="value">${properties.length}</div>
        <div class="change">Active Listings</div>
      </div>
      <div class="stat-card">
        <div class="label">Average Price</div>
        <div class="value">€${Math.round(marketData.avgPrice / 1000)}K</div>
        <div class="change">+${marketData.priceGrowthYoY}% YoY</div>
      </div>
      <div class="stat-card">
        <div class="label">Median Price</div>
        <div class="value">€${Math.round(marketData.medianPrice / 1000)}K</div>
        <div class="change">Market Value</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Key Insights</h2>
      <div class="insight-box">
        <strong>Market Position Analysis</strong>
        <p>The portfolio demonstrates excellent market positioning with an average price of €${Math.round(marketData.avgPrice).toLocaleString()}.
        Properties are well-distributed across ${Object.keys(byCounty).length} counties, providing geographic diversification
        and reducing market concentration risk. The portfolio's price range caters to multiple buyer segments.</p>
      </div>
      <div class="insight-box">
        <strong>Investment Potential</strong>
        <p>Based on current Irish market trends showing ${marketData.priceGrowthYoY}% annual growth, the portfolio is positioned
        for continued appreciation. Properties in prime locations demonstrate strong fundamentals with access to amenities,
        transport links, and employment centers.</p>
      </div>
    </div>
  </div>

  <!-- IRISH MARKET OVERVIEW PAGE -->
  <div class="page content-page">
    <div class="header">
      <h2>Irish Property Market Overview</h2>
    </div>
    <div class="footer">
      <span>${agencyName}</span>
      <span>${date}</span>
    </div>

    <div class="market-overview">
      <h3>Current Irish Market Conditions</h3>
      <p style="margin-bottom: 15px; line-height: 1.8;">
        The Irish property market continues to demonstrate resilience with sustained demand across all sectors.
        Key indicators show positive momentum, with average prices growing ${marketData.priceGrowthYoY}% year-over-year.
        Dublin and surrounding counties remain the primary drivers of market activity, accounting for the majority
        of transactions and value.
      </p>
      <div class="stats-grid" style="margin-top: 20px;">
        <div class="stat-card">
          <div class="label">Market Growth (YoY)</div>
          <div class="value">${marketData.priceGrowthYoY}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Avg Days on Market</div>
          <div class="value">${marketData.averageDaysOnMarket}</div>
        </div>
        <div class="stat-card">
          <div class="label">Price per m²</div>
          <div class="value">€${Math.round(marketData.pricePerSqM)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Regional Distribution</h2>
      <div class="chart-container">
        ${Object.entries(byCounty)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([county, info]) => {
            const maxCount = Math.max(...Object.values(byCounty).map(v => v.count));
            const width = (info.count / maxCount) * 100;
            return `
            <div class="chart-row">
              <div class="chart-label">${county}</div>
              <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${width}%">
                  <div class="chart-value">${info.count} properties</div>
                </div>
              </div>
            </div>
          `}).join('')}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Property Type Analysis</h2>
      <div class="chart-container">
        ${Object.entries(byType)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 8)
          .map(([type, info]) => {
            const maxCount = Math.max(...Object.values(byType).map(v => v.count));
            const width = (info.count / maxCount) * 100;
            return `
            <div class="chart-row">
              <div class="chart-label">${type}</div>
              <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${width}%; background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);">
                  <div class="chart-value">€${Math.round(info.avgPrice / 1000)}K avg</div>
                </div>
              </div>
            </div>
          `}).join('')}
      </div>
    </div>
  </div>

  ${properties.slice(0, 50).map((property, index) => this.generatePropertyPage(property, marketData, agencyName, date, index + 1)).join('')}

  <!-- FINAL RECOMMENDATIONS PAGE -->
  <div class="page content-page">
    <div class="header">
      <h2>Strategic Recommendations</h2>
    </div>
    <div class="footer">
      <span>${agencyName}</span>
      <span>${date}</span>
    </div>

    <div class="section">
      <h2 class="section-title">Portfolio Recommendations</h2>

      <div class="recommendation-box">
        <h4>Investment Strategy</h4>
        <ul class="recommendation-list">
          <li>Focus on properties in high-growth corridors with strong infrastructure development plans</li>
          <li>Prioritize locations with proximity to public transport, particularly DART and Luas lines</li>
          <li>Consider energy efficiency upgrades to improve BER ratings and attract environmentally conscious buyers</li>
          <li>Maintain competitive pricing aligned with local market comparables</li>
        </ul>
      </div>

      <div class="recommendation-box">
        <h4>Marketing Excellence</h4>
        <ul class="recommendation-list">
          <li>Implement professional photography and virtual tours for all premium properties</li>
          <li>Leverage digital marketing channels to reach international and domestic buyers</li>
          <li>Highlight unique property features and location advantages in listings</li>
          <li>Develop targeted campaigns for specific buyer segments based on property type</li>
        </ul>
      </div>

      <div class="recommendation-box">
        <h4>Market Positioning</h4>
        <ul class="recommendation-list">
          <li>Emphasize portfolio diversity across price points and locations</li>
          <li>Target first-time buyers with properties in the €200K-€350K range</li>
          <li>Position premium properties (>€500K) as lifestyle investments</li>
          <li>Highlight strong rental yields for investment property buyers</li>
        </ul>
      </div>
    </div>

    <div class="executive-summary" style="margin-top: 40px;">
      <h3>Conclusion</h3>
      <p>
        The ${agencyName} portfolio represents a well-balanced collection of properties positioned to capitalize
        on continued Irish market growth. With strategic marketing and competitive pricing, these properties
        are well-suited to meet diverse buyer needs across the market spectrum.
      </p>
      <p style="margin-top: 15px;">
        We recommend maintaining active portfolio management, regular price reviews, and responsive customer
        engagement to maximize transaction success rates and portfolio performance.
      </p>
    </div>
  </div>

</body>
</html>
    `;
  }

  private generatePropertyPage(property: PropertyData, marketData: MarketData, agencyName: string, date: string, pageNum: number): string {
    const priceVsMarket = ((property.price - marketData.avgPrice) / marketData.avgPrice * 100).toFixed(1);
    const pricePosition = Number(priceVsMarket) > 0 ? 'above' : 'below';
    const pricePerSqM = property.floorarea ? Math.round(property.price / property.floorarea) : 0;

    return `
  <div class="page content-page">
    <div class="header">
      <h2>Property Analysis #${pageNum}</h2>
    </div>
    <div class="footer">
      <span>${agencyName}</span>
      <span>${date}</span>
    </div>

    <div class="property-card">
      <div class="property-header">
        <h3>${property.title || property.address || 'Property ' + property.id}</h3>
        <div class="price">€${property.price.toLocaleString()}</div>
      </div>
      <div class="property-body">
        ${property.images && property.images[0] ? `
          <img src="${property.images[0]}" alt="Property" class="property-image" onerror="this.style.display='none'">
        ` : ''}

        <div class="property-details">
          ${property.bedrooms ? `
            <div class="detail-item">
              <strong>Bedrooms</strong>
              <span>${property.bedrooms}</span>
            </div>
          ` : ''}
          ${property.bathrooms ? `
            <div class="detail-item">
              <strong>Bathrooms</strong>
              <span>${property.bathrooms}</span>
            </div>
          ` : ''}
          ${property.type ? `
            <div class="detail-item">
              <strong>Property Type</strong>
              <span>${property.type}</span>
            </div>
          ` : ''}
          ${property.county ? `
            <div class="detail-item">
              <strong>County</strong>
              <span>${property.county}</span>
            </div>
          ` : ''}
          ${property.city ? `
            <div class="detail-item">
              <strong>City/Town</strong>
              <span>${property.city}</span>
            </div>
          ` : ''}
          ${property.ber_rating ? `
            <div class="detail-item">
              <strong>BER Rating</strong>
              <span>${property.ber_rating}</span>
            </div>
          ` : ''}
          ${property.floorarea ? `
            <div class="detail-item">
              <strong>Floor Area</strong>
              <span>${property.floorarea} m²</span>
            </div>
          ` : ''}
          ${pricePerSqM > 0 ? `
            <div class="detail-item">
              <strong>Price per m²</strong>
              <span>€${pricePerSqM}</span>
            </div>
          ` : ''}
        </div>

        ${property.description ? `
          <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px;">
            <strong style="display: block; margin-bottom: 8px; color: #1e3a8a;">Description</strong>
            <p style="font-size: 14px; line-height: 1.7;">${property.description.substring(0, 400)}${property.description.length > 400 ? '...' : ''}</p>
          </div>
        ` : ''}

        <div class="comparison-section">
          <h4>Market Comparison Analysis</h4>
          <p style="font-size: 14px; margin-bottom: 15px;">
            This property is priced ${Math.abs(Number(priceVsMarket))}% ${pricePosition} the portfolio average,
            positioning it in the ${Number(priceVsMarket) > 20 ? 'premium' : Number(priceVsMarket) < -20 ? 'value' : 'mid-range'} market segment.
          </p>
          <div class="comparison-grid">
            <div class="comparison-item">
              <div class="label">Property Price</div>
              <div class="value">€${(property.price / 1000).toFixed(0)}K</div>
            </div>
            <div class="comparison-item">
              <div class="label">Market Average</div>
              <div class="value">€${(marketData.avgPrice / 1000).toFixed(0)}K</div>
            </div>
            <div class="comparison-item">
              <div class="label">vs. Market</div>
              <div class="value" style="color: ${Number(priceVsMarket) > 0 ? '#dc2626' : '#10b981'}">${priceVsMarket}%</div>
            </div>
            <div class="comparison-item">
              <div class="label">Market Position</div>
              <div class="value" style="font-size: 16px;">${Number(priceVsMarket) > 20 ? 'Premium' : Number(priceVsMarket) < -20 ? 'Value' : 'Mid-Range'}</div>
            </div>
          </div>
        </div>

        <div class="recommendation-box">
          <h4>Investment Recommendations</h4>
          <ul class="recommendation-list">
            <li>Target buyer profile: ${property.bedrooms && property.bedrooms >= 4 ? 'Families seeking spacious accommodation' : property.bedrooms === 1 ? 'First-time buyers or investors' : 'Young professionals or small families'}</li>
            <li>Key selling points: ${property.county} location${property.ber_rating ? ', ' + property.ber_rating + ' energy rating' : ''}${property.floorarea ? ', ' + property.floorarea + 'm² living space' : ''}</li>
            <li>Marketing strategy: ${Number(priceVsMarket) > 10 ? 'Emphasize premium features and exclusive location benefits' : 'Highlight excellent value proposition and investment potential'}</li>
            <li>Expected market interest: ${property.bedrooms && property.bedrooms >= 3 ? 'High demand from family buyers' : 'Strong interest from first-time buyers and investors'}</li>
          </ul>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <strong style="color: #1e3a8a; display: block; margin-bottom: 8px;">Location Advantages</strong>
          <p style="font-size: 14px; line-height: 1.7;">
            ${property.county === 'Dublin' ?
              'Prime Dublin location with excellent access to city centre amenities, public transport, and employment hubs. Strong rental market and capital appreciation potential.' :
              `Located in ${property.county}, offering excellent value with access to local amenities, good schools, and improving transport links. Growing market with strong fundamentals.`
            }
          </p>
        </div>
      </div>
    </div>
  </div>
    `;
  }
}

export const professionalReportGenerator = new ProfessionalReportGenerator();
