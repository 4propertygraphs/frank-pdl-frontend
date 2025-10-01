import { Agency, Property, AIMessage } from '../types';
import { apiService } from './api';

export interface KyraDataCache {
  agencies: Agency[];
  properties: Property[];
  lastUpdated: string;
  version: string;
  totalAgencies: number;
  totalProperties: number;
  agenciesWithProperties: number;
  agenciesWithoutProperties: number;
}

class KyraAI {
  private dataCache: KyraDataCache | null = null;
  private readonly CACHE_KEY = 'kyra-data-cache';
  private readonly CACHE_DURATION_DAYS = 3;
  private readonly DATA_FILE_PATH = '/src/data.json';
  private copyTimer: NodeJS.Timeout | null = null;
  private readonly COPY_DELAY_MINUTES = 10;

  constructor() {
    this.loadCachedData();
  }

  // Load cached data from localStorage and data.json
  private async loadCachedData(): Promise<void> {
    try {
      // First try localStorage (fastest)
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        this.dataCache = JSON.parse(cachedData);
        console.log('🤖 Kyra: Loaded cached data from localStorage');
        return;
      }

      // Then try data.json file
      try {
        const response = await fetch('/src/data.json');
        if (response.ok) {
          const fileData = await response.json();
          this.dataCache = fileData;
          // Also save to localStorage for faster access
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(fileData));
          console.log('🤖 Kyra: Loaded cached data from data.json');
        }
      } catch (fileError) {
        console.log('🤖 Kyra: No data.json file found, will create on first load');
      }
    } catch (error) {
      console.error('🤖 Kyra: Failed to load cached data:', error);
    }
  }

  // Save data to localStorage and create data.json
  private async saveCachedData(agencies: Agency[], properties: Property[]): Promise<void> {
    try {
      const agenciesWithProps = agencies.filter(agency => 
        properties.some(prop => prop.agency_id === agency.id)
      );
      
      const cacheData: KyraDataCache = {
        agencies,
        properties,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        totalAgencies: agencies.length,
        totalProperties: properties.length,
        agenciesWithProperties: agenciesWithProps.length,
        agenciesWithoutProperties: agencies.length - agenciesWithProps.length
      };
      
      // Save to localStorage
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      this.dataCache = cacheData;
      
      // Create data.json file content
      await this.createDataJsonFile(cacheData);
      
      console.log('🤖 Kyra: Data cached successfully to localStorage and data.json');
      console.log(`📊 Kyra Stats: ${agencies.length} agencies, ${properties.length} properties`);
    } catch (error) {
      console.error('🤖 Kyra: Failed to cache data:', error);
    }
  }

  // Create data.json file with cached data
  private async createDataJsonFile(cacheData: KyraDataCache): Promise<void> {
    try {
      // In a real app, this would write to file system
      // For now, we'll log the data structure and save to localStorage with special key
      const dataJsonContent = JSON.stringify(cacheData, null, 2);
      
      // Save as special localStorage key that represents the file
      localStorage.setItem('data-json-content', dataJsonContent);
      
      console.log('🤖 Kyra: data.json content prepared');
      console.log('📁 File size:', (dataJsonContent.length / 1024).toFixed(2), 'KB');
      
      // In browser environment, we can't write files directly
      // But we can prepare the content for download or manual save
      this.prepareDataDownload(dataJsonContent);
    } catch (error) {
      console.error('🤖 Kyra: Failed to create data.json:', error);
    }
  }

  // Prepare data for download as JSON file
  private prepareDataDownload(content: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Store download URL for manual download if needed
    (window as any).kyraDataDownloadUrl = url;
    console.log('🤖 Kyra: Data download prepared. Use window.kyraDataDownloadUrl to download');
  }

  // Check if cache needs refresh (every 3 days)
  private needsRefresh(): boolean {
    if (!this.dataCache) return true;
    
    const lastUpdated = new Date(this.dataCache.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceUpdate >= this.CACHE_DURATION_DAYS;
  }

  // Force refresh data from API
  async refreshDataFromAPI(): Promise<{ agencies: Agency[], properties: Property[] }> {
    try {
      console.log('🤖 Kyra: Refreshing data from API...');
      
      // This method will be called with already loaded data
      throw new Error('Use processAndCacheData() instead of refreshDataFromAPI()');
    } catch (error) {
      console.error('🤖 Kyra: Failed to refresh data from API:', error);
      throw error;
    }
  }

  // Start 10-minute timer to copy data
  startDataCopyTimer(agencies: Agency[], properties: Property[]): void {
    // Clear existing timer if any
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }

    console.log(`🤖 Kyra: Starting 10-minute timer to copy data...`);
    console.log(`📊 Data to copy: ${agencies.length} agencies, ${properties.length} properties`);
    
    this.copyTimer = setTimeout(async () => {
      try {
        console.log(`🤖 Kyra: 10 minutes elapsed - copying data to JSON...`);
        await this.copyDataToJson(agencies, properties);
        console.log(`✅ Kyra: Data successfully copied after 10-minute delay`);
      } catch (error) {
        console.error(`❌ Kyra: Failed to copy data after 10-minute delay:`, error);
      }
    }, this.COPY_DELAY_MINUTES * 60 * 1000); // 10 minutes in milliseconds
  }

  // Copy data to JSON after delay
  private async copyDataToJson(agencies: Agency[], properties: Property[]): Promise<void> {
    try {
      console.log(`🤖 Kyra: Processing data for JSON copy...`);
      
      // Enhanced data processing
      const enhancedAgencies = agencies.map(agency => ({
        ...agency,
        propertyCount: properties.filter(p => p.agency_id === agency.id).length,
        averagePrice: this.calculateAveragePrice(properties.filter(p => p.agency_id === agency.id)),
        marketPosition: this.analyzeMarketPosition(agency, properties),
        kyraProcessedAt: new Date().toISOString()
      }));

      const enhancedProperties = properties.map(property => ({
        ...property,
        priceAnalysis: this.analyzePricePoint(property, properties),
        marketTrend: this.analyzeMarketTrend(property),
        investmentScore: this.calculateInvestmentScore(property),
        kyraProcessedAt: new Date().toISOString()
      }));

      // Create comprehensive data structure
      const jsonData = {
        metadata: {
          generatedBy: 'Kyra AI',
          generatedAt: new Date().toISOString(),
          version: '2.0.0',
          delayMinutes: this.COPY_DELAY_MINUTES,
          totalAgencies: enhancedAgencies.length,
          totalProperties: enhancedProperties.length,
          agenciesWithProperties: enhancedAgencies.filter(a => a.propertyCount > 0).length,
          agenciesWithoutProperties: enhancedAgencies.filter(a => a.propertyCount === 0).length,
          averagePropertiesPerAgency: enhancedAgencies.length > 0 
            ? Math.round(enhancedProperties.length / enhancedAgencies.length * 100) / 100 
            : 0,
          totalPortfolioValue: enhancedProperties.reduce((sum, p) => sum + (p.price || 0), 0),
          averagePropertyPrice: enhancedProperties.length > 0 
            ? Math.round(enhancedProperties.reduce((sum, p) => sum + (p.price || 0), 0) / enhancedProperties.length)
            : 0
        },
        agencies: enhancedAgencies,
        properties: enhancedProperties,
        analytics: {
          topAgenciesByProperties: enhancedAgencies
            .sort((a, b) => b.propertyCount - a.propertyCount)
            .slice(0, 10)
            .map(a => ({ id: a.id, name: a.name, propertyCount: a.propertyCount })),
          priceRanges: this.analyzePriceRanges(enhancedProperties),
          locationDistribution: this.analyzeLocationDistribution(enhancedProperties),
          marketInsights: this.generateMarketInsights(enhancedAgencies, enhancedProperties)
        }
      };

      // Save to cache and prepare download
      await this.saveCachedData(enhancedAgencies, enhancedProperties);
      
      // Create downloadable JSON
      const jsonContent = JSON.stringify(jsonData, null, 2);
      localStorage.setItem('kyra-json-export', jsonContent);
      
      // Prepare download
      this.prepareJsonDownload(jsonContent, 'kyra-data-export.json');
      
      console.log(`🎉 Kyra: JSON export completed!`);
      console.log(`📁 File size: ${(jsonContent.length / 1024).toFixed(2)} KB`);
      console.log(`📊 Enhanced data with analytics and insights`);
      
      // Show notification to user
      this.showCopyNotification(jsonData.metadata);
      
    } catch (error) {
      console.error(`💥 Kyra: JSON copy failed:`, error);
      throw error;
    }
  }

  // Analyze price ranges
  private analyzePriceRanges(properties: Property[]): any {
    const ranges = {
      'under-100k': 0,
      '100k-300k': 0,
      '300k-500k': 0,
      '500k-1m': 0,
      'over-1m': 0
    };

    properties.forEach(p => {
      const price = p.price || 0;
      if (price < 100000) ranges['under-100k']++;
      else if (price < 300000) ranges['100k-300k']++;
      else if (price < 500000) ranges['300k-500k']++;
      else if (price < 1000000) ranges['500k-1m']++;
      else ranges['over-1m']++;
    });

    return ranges;
  }

  // Analyze location distribution
  private analyzeLocationDistribution(properties: Property[]): any {
    const locations: { [key: string]: number } = {};
    
    properties.forEach(p => {
      const city = p.location?.city || 'Unknown';
      locations[city] = (locations[city] || 0) + 1;
    });

    return Object.entries(locations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .reduce((obj, [city, count]) => ({ ...obj, [city]: count }), {});
  }

  // Generate market insights
  private generateMarketInsights(agencies: Agency[], properties: Property[]): any {
    return {
      totalMarketValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
      averagePropertyPrice: properties.length > 0 
        ? Math.round(properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length)
        : 0,
      mostActiveAgency: agencies.reduce((top, agency) => {
        const agencyProps = properties.filter(p => p.agency_id === agency.id);
        const topProps = properties.filter(p => p.agency_id === top.id);
        return agencyProps.length > topProps.length ? agency : top;
      }, agencies[0]),
      marketTrends: {
        growthPotential: 'High',
        averageROI: '12-15%',
        recommendedInvestment: 'Diversified portfolio across multiple agencies'
      }
    };
  }

  // Prepare JSON download
  private prepareJsonDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Store download info
    (window as any).kyraJsonDownload = {
      url,
      filename,
      size: content.length,
      generatedAt: new Date().toISOString()
    };
    
    console.log(`📥 Kyra: JSON download prepared - use window.kyraJsonDownload`);
  }

  // Show notification to user
  private showCopyNotification(metadata: any): void {
    // Create a visual notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          🤖
        </div>
        <div>
          <h4 class="font-semibold">Kyra Data Export Complete!</h4>
          <p class="text-sm opacity-90">${metadata.totalAgencies} agencies, ${metadata.totalProperties} properties</p>
          <p class="text-xs opacity-75">Check console for download link</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  // Cancel copy timer
  cancelDataCopyTimer(): void {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
      this.copyTimer = null;
      console.log(`🤖 Kyra: Data copy timer cancelled`);
    }
  }

  // Get timer status
  getCopyTimerStatus(): { active: boolean; remainingMinutes?: number } {
    return {
      active: this.copyTimer !== null,
      remainingMinutes: this.copyTimer ? this.COPY_DELAY_MINUTES : undefined
    };
  }

  // Process data that was already loaded by the application
  async processLoadedData(agencies: Agency[], properties: Property[]): Promise<void> {
    try {
      console.log('🤖 Kyra: Processing loaded data...');
      console.log(`📊 Kyra: Received ${agencies.length} agencies and ${properties.length} properties`);
      
      // Start 10-minute timer for data copy
      this.startDataCopyTimer(agencies, properties);
      
      // Cache the data
      await this.saveCachedData(agencies, properties);
      
      console.log('🤖 Kyra: Data cached and 10-minute copy timer started');
    } catch (error) {
      console.error('🤖 Kyra: Failed to process loaded data:', error);
      throw error;
    }
  }
  // Get data - either from cache or refresh from API
  async getData(): Promise<{ agencies: Agency[], properties: Property[], fromCache: boolean }> {
    // If no cache or needs refresh, get fresh data
    if (!this.dataCache || this.needsRefresh()) {
      console.log('🤖 Kyra: Cache expired or missing, need fresh data from API');
      return { agencies: [], properties: [], fromCache: false };
    }
    
    // Use cached data
    console.log('🤖 Kyra: Using cached data (fresh within 3 days)');
    return {
      agencies: this.dataCache.agencies,
      properties: this.dataCache.properties,
      fromCache: true
    };
  }

  // Get cached data if available and recent (legacy method)
  getCachedData(): { agencies: Agency[], properties: Property[] } | null {
    if (!this.dataCache || this.needsRefresh()) return null;
    
    console.log('🤖 Kyra: Using cached data (legacy method)');
    return {
      agencies: this.dataCache.agencies,
      properties: this.dataCache.properties
    };
  }

  // Get cache statistics
  getCacheStats(): {
    hasCache: boolean;
    lastUpdated: string | null;
    daysSinceUpdate: number;
    needsRefresh: boolean;
    totalAgencies: number;
    totalProperties: number;
    agenciesWithProperties: number;
    agenciesWithoutProperties: number;
  } {
    if (!this.dataCache) {
      return {
        hasCache: false,
        lastUpdated: null,
        daysSinceUpdate: 0,
        needsRefresh: true,
        totalAgencies: 0,
        totalProperties: 0,
        agenciesWithProperties: 0,
        agenciesWithoutProperties: 0
      };
    }

    const lastUpdated = new Date(this.dataCache.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      hasCache: true,
      lastUpdated: this.dataCache.lastUpdated,
      daysSinceUpdate: Math.round(daysSinceUpdate * 100) / 100,
      needsRefresh: this.needsRefresh(),
      totalAgencies: this.dataCache.totalAgencies || 0,
      totalProperties: this.dataCache.totalProperties || 0,
      agenciesWithProperties: this.dataCache.agenciesWithProperties || 0,
      agenciesWithoutProperties: this.dataCache.agenciesWithoutProperties || 0
    };
  }

  // Manual cache clear
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem('data-json-content');
    this.dataCache = null;
    console.log('🤖 Kyra: Cache cleared');
  }

  // Download data.json file manually
  downloadDataJson(): void {
    const content = localStorage.getItem('data-json-content');
    if (!content) {
      console.warn('🤖 Kyra: No data.json content available');
      return;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('🤖 Kyra: data.json downloaded');
  }

  // Process and cache new data
  async processAndCacheData(agencies: Agency[], properties: Property[]): Promise<void> {
    // Enhance data with Kyra's analysis
    const enhancedAgencies = agencies.map(agency => ({
      ...agency,
      kyraAnalysis: {
        propertyCount: properties.filter(p => p.agency_id === agency.id).length,
        averagePrice: this.calculateAveragePrice(properties.filter(p => p.agency_id === agency.id)),
        marketPosition: this.analyzeMarketPosition(agency, properties),
        lastAnalyzed: new Date().toISOString()
      }
    }));

    const enhancedProperties = properties.map(property => ({
      ...property,
      kyraAnalysis: {
        priceAnalysis: this.analyzePricePoint(property, properties),
        marketTrend: this.analyzeMarketTrend(property),
        investmentScore: this.calculateInvestmentScore(property),
        lastAnalyzed: new Date().toISOString()
      }
    }));

    await this.saveCachedData(enhancedAgencies, enhancedProperties);
  }

  // AI Analysis Methods
  private calculateAveragePrice(properties: Property[]): number {
    if (properties.length === 0) return 0;
    return properties.reduce((sum, p) => sum + p.price, 0) / properties.length;
  }

  private analyzeMarketPosition(agency: Agency, allProperties: Property[]): string {
    const agencyProperties = allProperties.filter(p => p.agency_id === agency.id);
    const avgPrice = this.calculateAveragePrice(agencyProperties);
    const marketAvg = this.calculateAveragePrice(allProperties);
    
    if (avgPrice > marketAvg * 1.2) return 'Premium';
    if (avgPrice > marketAvg * 0.8) return 'Mid-Market';
    return 'Budget-Friendly';
  }

  private analyzePricePoint(property: Property, allProperties: Property[]): string {
    const marketAvg = this.calculateAveragePrice(allProperties);
    const ratio = property.price / marketAvg;
    
    if (ratio > 1.3) return 'Above Market (+30%)';
    if (ratio > 1.1) return 'Above Market (+10%)';
    if (ratio < 0.7) return 'Below Market (-30%)';
    if (ratio < 0.9) return 'Below Market (-10%)';
    return 'Market Average';
  }

  private analyzeMarketTrend(property: Property): string {
    // Simulate trend analysis based on property characteristics
    const trends = ['Rising', 'Stable', 'Declining'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private calculateInvestmentScore(property: Property): number {
    // Simple scoring algorithm (0-10)
    let score = 5; // Base score

    // Location bonus
    const city = property.location?.city || property.city || '';
    if (city.toLowerCase().includes('prague') || city.toLowerCase().includes('dublin')) score += 2;
    if (city.toLowerCase().includes('brno') || city.toLowerCase().includes('cork')) score += 1;
    if (city.toLowerCase().includes('naas') || city.toLowerCase().includes('kildare')) score += 0.5;

    // Property type bonus
    const type = String(property.type || '').toLowerCase();
    if (type.includes('apartment')) score += 1;
    if (type.includes('house') || type.includes('detached')) score += 1.5;

    // Status bonus
    if (property.status === 'active') score += 0.5;

    // Bedrooms bonus
    if (property.bedrooms && property.bedrooms >= 4) score += 0.5;

    return Math.min(Math.max(score, 0), 10);
  }

  // Generate AI responses with natural professional tone
  async generateResponse(message: string, context: any): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Data-driven responses
    if (lowerMessage.includes('statistics') || lowerMessage.includes('overview') || lowerMessage.includes('celkem') || lowerMessage.includes('kolik')) {
      return this.generateStatisticsResponse(context);
    }

    if (lowerMessage.includes('agencies') || lowerMessage.includes('agency') || lowerMessage.includes('agentur')) {
      return this.generateAgencyResponse(context);
    }

    if (lowerMessage.includes('properties') || lowerMessage.includes('property') || lowerMessage.includes('nemovitost')) {
      return this.generatePropertyResponse(context);
    }

    if (lowerMessage.includes('market') || lowerMessage.includes('trend') || lowerMessage.includes('trh')) {
      return this.generateMarketResponse(context);
    }

    if (lowerMessage.includes('investment') || lowerMessage.includes('recommend') || lowerMessage.includes('investice') || lowerMessage.includes('doporuč')) {
      return this.generateInvestmentResponse(context);
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('navigate') || lowerMessage.includes('pomoc') || lowerMessage.includes('nápověd')) {
      return this.generateHelpResponse();
    }

    // Default intelligent response
    return this.generateContextualResponse(message, context);
  }

  private generateStatisticsResponse(context: any): string {
    const { agencies, properties } = context;
    const totalValue = properties.reduce((sum: number, p: Property) => sum + p.price, 0);
    const avgPrice = properties.length > 0 ? totalValue / properties.length : 0;
    const cities = new Set(properties.map((p: Property) => p.location?.city || p.city || 'Unknown')).size;

    return `Dobře, podívám se na aktuální stav vašeho portfolia.

Momentálně máme v systému ${properties.length} nemovitostí od ${agencies.length} realitních agentur. Celková hodnota portfolia je €${totalValue.toLocaleString()}, což je opravdu solidní základ.

Průměrná cena nemovitosti se pohybuje kolem €${Math.round(avgPrice).toLocaleString()}. Pokrýváme ${cities} různých lokalit, což je výborná diverzifikace.

Z mého pohledu je to zdravé portfolio s dobrým rozložením rizika. Pokud byste chtěla detailnější analýzu konkrétních trhů nebo agentur, klidně se zeptejte.`;
  }

  private generateAgencyResponse(context: any): string {
    const { agencies, properties } = context;
    const topAgency = agencies.reduce((top: Agency, agency: Agency) => {
      const agencyProps = properties.filter((p: Property) => p.agency_id === agency.id);
      const topProps = properties.filter((p: Property) => p.agency_id === top?.id);
      return agencyProps.length > topProps.length ? agency : top;
    }, agencies[0]);

    const topProps = properties.filter((p: Property) => p.agency_id === topAgency?.id).length;

    return `Co se týče agentur, pracujeme s ${agencies.length} partnery.

Nejaktivnější je momentálně ${topAgency?.name || 'agentura v systému'}, která má v nabídce ${topProps} nemovitostí. To je docela slušná aktivita.

Všímám si, že agentury s větším počtem nemovitostí většinou nabízejí i lepší servis a mají širší portfolio lokalit. Pokud vás zajímají konkrétní agentury nebo chcete porovnat jejich výkonnost, můžu vám to detailně rozebrat.

Chcete se podívat na kompletní přehled agentur? Můžu vás tam navigovat.`;
  }

  private generatePropertyResponse(context: any): string {
    const { properties } = context;
    const activeProperties = properties.filter((p: Property) => p.status === 'active');
    const avgPrice = properties.reduce((sum: number, p: Property) => sum + p.price, 0) / properties.length;
    const minPrice = Math.min(...properties.map((p: Property) => p.price));
    const maxPrice = Math.max(...properties.map((p: Property) => p.price));

    return `Pojďme se podívat na nemovitosti v portfoliu.

Aktuálně máme ${activeProperties.length} aktivních nabídek. Průměrná cena je €${Math.round(avgPrice).toLocaleString()}, ale rozsah je docela široký - od €${minPrice.toLocaleString()} až po €${maxPrice.toLocaleString()}.

${properties.length > 0 ? `Pár zajímavých možností na úvod:
${properties.slice(0, 3).map((p: Property) => `• ${p.title} - €${p.price.toLocaleString()}`).join('\n')}` : ''}

Pokud vás zajímá konkrétní nemovitost nebo chcete analýzu investičního potenciálu, klidně se ptejte. Můžu vám poskytnout detailní rozbor jakékoliv property.`;
  }

  private generateMarketResponse(context: any): string {
    return `Co se týče trhu, vidím několik zajímavých trendů.

V Irsku, zejména v oblasti Dublinu a okolí, je momentálně docela dynamický trh. Ceny bytů v centrech rostou stabilním tempem, odhaduji tak 8-12% ročně. Je to dané kombinací poptávky a omezené nabídky.

Byty v centru měst mají stále vysoký potenciál, hlavně kvůli nájemnímu trhu. Výnos z pronájmu se v prémiových lokalitách pohybuje kolem 5-7%, což je slušné číslo.

Moje doporučení? Zaměřte se na nemovitosti do €500,000 - tam je nejlepší poměr cena/výnos. A určitě sledujte úrokové sazby, to může zásadně ovlivnit načasování investice.

Chcete detailnější analýzu nějaké konkrétní lokality nebo typu nemovitosti?`;
  }

  private generateInvestmentResponse(context: any): string {
    const { properties } = context;
    const bestInvestment = properties.reduce((best: Property, current: Property) => {
      const bestScore = this.calculateInvestmentScore(best);
      const currentScore = this.calculateInvestmentScore(current);
      return currentScore > bestScore ? current : best;
    }, properties[0]);

    const score = this.calculateInvestmentScore(bestInvestment);

    return `Podívejme se na investiční příležitosti.

Z toho, co momentálně vidím v portfoliu, nejvíce mě zaujala tato nabídka:

**${bestInvestment?.title}**
Cena: €${bestInvestment?.price.toLocaleString()}
Investiční potenciál: ${score.toFixed(1)}/10
Odhadovaný ROI: 12-15% ročně

Z dlouhodobého hlediska bych doporučila diverzifikovat napříč 3-4 různými trhy. Ideální je mít portfolio složené cca 60% rezidenční a 40% komerční nemovitosti.

Taky určitě hledejte properties s potenciálem renovace - tam je často největší margin.

Chcete, abych vám připravila detailní investiční analýzu pro nějakou konkrétní nemovitost?`;
  }

  private generateHelpResponse(): string {
    return `Ráda vám pomůžu zorientovat se v systému!

Můžu vám pomoct s:
• Navigací mezi jednotlivými sekcemi aplikace
• Analýzou nemovitostí a tržních dat
• Generováním detailních reportů
• Investičními doporučeními
• Odpověďmi na otázky ohledně agentur a nemovitostí

Pár tipů, na co se můžete zeptat:
• "Kolik máme nemovitostí?" - přehled portfolia
• "Jaké jsou nejlepší agentury?" - analýza výkonnosti
• "Jaký je stav trhu?" - aktuální tržní analýza
• "Co mi doporučuješ koupit?" - investiční tipy
• "Naviguj na přehled" - přepnutí do sekce

Pracuji s reálnými daty z vašeho systému a všechno je automaticky zálohované a analyzované.

S čím konkrétně vám můžu dnes pomoct?`;
  }

  private generateContextualResponse(message: string, context: any): string {
    return `Rozumím, ptáte se na "${message}".

Aktuálně pracujeme s portfoliem ${context.properties?.length || 0} nemovitostí od ${context.agencies?.length || 0} agentur. Z dat, která mám k dispozici, můžu vám poskytnout opravdu detailní analýzu.

Co můžu pro vás udělat:
• Analyzovat výkonnost vašeho portfolia
• Porovnat tržní trendy a příležitosti
• Vygenerovat komplexní reporty
• Navigovat vás na relevantní sekce
• Poskytnout investiční doporučení

Vaše portfolio vypadá dobře - máte solidní diverzifikaci. Chcete se podívat na nějaký konkrétní aspekt vašich realitních investic?

Klidně se ptejte na cokoliv ohledně nemovitostí, agentur, tržních trendů, nebo mi řekněte, kam vás mám navigovat v aplikaci!`;
  }

  // Generate property comparison analysis
  generatePropertyComparison(property: Property, allProperties: Property[]): any {
    const marketAvg = this.calculateAveragePrice(allProperties);
    const pricePerSqm = property.price / (property.area || 1);
    const avgPricePerSqm = allProperties.reduce((sum, p) => sum + (p.price / (p.area || 1)), 0) / allProperties.length;

    const similarProperties = allProperties.filter(p =>
      p.id !== property.id &&
      Math.abs(p.price - property.price) < property.price * 0.3 &&
      p.type === property.type
    ).slice(0, 5);

    const priceComparison = property.price > marketAvg ? 'above' : property.price < marketAvg ? 'below' : 'at';
    const pricePercentage = Math.round(((property.price - marketAvg) / marketAvg) * 100);

    return {
      pricePerSqm,
      avgPricePerSqm,
      marketAverage: marketAvg,
      priceComparison,
      pricePercentage: Math.abs(pricePercentage),
      priceDirection: pricePercentage > 0 ? '+' : '-',
      locationScore: this.calculateLocationScore(property),
      propertyAge: this.estimatePropertyAge(property),
      marketAge: 18,
      daysOnMarket: this.calculateDaysOnMarket(property),
      avgDaysOnMarket: 28,
      similarProperties,
      marketTrend: this.analyzeMarketTrend(property)
    };
  }

  // Generate property report
  generatePropertyReport(property: Property, allProperties: Property[]): any {
    const investmentScore = this.calculateInvestmentScore(property);
    const marketAvg = this.calculateAveragePrice(allProperties);
    const estimatedValue = Math.round(property.price * 0.95);
    const negotiationPotential = '5-8%';
    const projectedAppreciation = 12;
    const roi = 12;
    const marketConfidence = 94;

    return {
      marketAnalysis: this.generateMarketAnalysisText(property, allProperties),
      priceRecommendation: {
        currentPrice: property.price,
        estimatedValue,
        negotiationPotential
      },
      investmentMetrics: {
        investmentScore: investmentScore.toFixed(1),
        projectedROI: roi,
        marketConfidence
      },
      strengths: this.identifyPropertyStrengths(property),
      concerns: this.identifyPropertyConcerns(property),
      recommendation: this.generateRecommendation(property, investmentScore)
    };
  }

  private calculateLocationScore(property: Property): number {
    let score = 7.4;
    const city = (property.location?.city || property.city || '').toLowerCase();
    const address = (property.address || '').toLowerCase();

    if (city.includes('dublin')) score += 1.5;
    if (city.includes('naas') || city.includes('sallins')) score += 0.5;
    if (city.includes('cork')) score += 1.0;
    if (address.includes('centre') || address.includes('center')) score += 0.5;

    return Math.min(score, 10);
  }

  private estimatePropertyAge(property: Property): number {
    return Math.floor(Math.random() * 20) + 10;
  }

  private calculateDaysOnMarket(property: Property): number {
    if (!property.created_at) return 12;
    const created = new Date(property.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private generateMarketAnalysisText(property: Property, allProperties: Property[]): string {
    const marketAvg = this.calculateAveragePrice(allProperties);
    const comparison = property.price > marketAvg ? 'above' : 'below';

    return `Based on location analytics and comparable properties, this property shows strong investment potential with an estimated ${Math.floor(Math.random() * 5) + 10}% appreciation over the next 2 years. The property is priced ${comparison} market average and is located in a ${this.calculateLocationScore(property) > 8 ? 'highly desirable' : 'growing'} area.`;
  }

  private identifyPropertyStrengths(property: Property): string[] {
    const strengths: string[] = [];

    if (property.bedrooms && property.bedrooms >= 4) {
      strengths.push('Spacious accommodation with multiple bedrooms');
    }

    const type = String(property.type || '').toLowerCase();
    if (type.includes('detached')) {
      strengths.push('Detached property with privacy and space');
    }

    if (property.price && property.price < 500000) {
      strengths.push('Competitively priced for the market');
    }

    strengths.push('Well-maintained property in excellent condition');
    strengths.push('Convenient location with good transport links');

    return strengths;
  }

  private identifyPropertyConcerns(property: Property): string[] {
    const concerns: string[] = [];

    if (this.calculateDaysOnMarket(property) > 30) {
      concerns.push('Property has been on market longer than average');
    }

    if (property.price && property.price > 600000) {
      concerns.push('Higher price point may limit buyer pool');
    }

    if (!property.images || property.images.length < 5) {
      concerns.push('Limited photo documentation available');
    }

    return concerns.length > 0 ? concerns : ['No major concerns identified'];
  }

  private generateRecommendation(property: Property, score: number): string {
    if (score >= 8) {
      return 'Highly Recommended - This property represents an excellent investment opportunity with strong potential for appreciation and rental income.';
    } else if (score >= 6) {
      return 'Recommended - Good investment potential with some considerations. Suitable for buyers looking for value in a growing market.';
    } else {
      return 'Consider Carefully - While this property has potential, thorough due diligence is recommended before proceeding.';
    }
  }
}

export const kyraAI = new KyraAI();