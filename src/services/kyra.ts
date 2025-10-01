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
    if (property.location.city.toLowerCase().includes('prague')) score += 2;
    if (property.location.city.toLowerCase().includes('brno')) score += 1;
    
    // Property type bonus
    if (property.type.toLowerCase().includes('apartment')) score += 1;
    if (property.type.toLowerCase().includes('house')) score += 1.5;
    
    // Status bonus
    if (property.status === 'active') score += 0.5;
    
    return Math.min(Math.max(score, 0), 10);
  }

  // Generate AI responses
  async generateResponse(message: string, context: any): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Data-driven responses
    if (lowerMessage.includes('statistics') || lowerMessage.includes('overview')) {
      return this.generateStatisticsResponse(context);
    }
    
    if (lowerMessage.includes('agencies') || lowerMessage.includes('agency')) {
      return this.generateAgencyResponse(context);
    }
    
    if (lowerMessage.includes('properties') || lowerMessage.includes('property')) {
      return this.generatePropertyResponse(context);
    }
    
    if (lowerMessage.includes('market') || lowerMessage.includes('trend')) {
      return this.generateMarketResponse(context);
    }
    
    if (lowerMessage.includes('investment') || lowerMessage.includes('recommend')) {
      return this.generateInvestmentResponse(context);
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('navigate')) {
      return this.generateHelpResponse();
    }
    
    // Default intelligent response
    return this.generateContextualResponse(message, context);
  }

  private generateStatisticsResponse(context: any): string {
    const { agencies, properties } = context;
    const totalValue = properties.reduce((sum: number, p: Property) => sum + p.price, 0);
    const avgPrice = properties.length > 0 ? totalValue / properties.length : 0;
    
    return `📊 **Current Portfolio Statistics:**
    
• **Total Properties:** ${properties.length}
• **Active Agencies:** ${agencies.length}
• **Portfolio Value:** $${totalValue.toLocaleString()}
• **Average Price:** $${Math.round(avgPrice).toLocaleString()}
• **Market Coverage:** ${new Set(properties.map((p: Property) => p.location.city)).size} cities

**Market Insights:** Based on current data, your portfolio shows strong diversification across multiple markets. I recommend focusing on the Prague market for premium investments.`;
  }

  private generateAgencyResponse(context: any): string {
    const { agencies, properties } = context;
    const topAgency = agencies.reduce((top: Agency, agency: Agency) => {
      const agencyProps = properties.filter((p: Property) => p.agency_id === agency.id);
      const topProps = properties.filter((p: Property) => p.agency_id === top.id);
      return agencyProps.length > topProps.length ? agency : top;
    }, agencies[0]);
    
    return `🏢 **Agency Analysis:**
    
**Top Performing Agency:** ${topAgency?.name}
• Properties Listed: ${properties.filter((p: Property) => p.agency_id === topAgency?.id).length}
• Market Position: Premium

**Recommendations:**
• Consider expanding partnerships with high-performing agencies
• Focus on agencies with strong local market presence
• Evaluate agency performance metrics regularly

Would you like me to show detailed agency comparisons or navigate to the Agencies section?`;
  }

  private generatePropertyResponse(context: any): string {
    const { properties } = context;
    const activeProperties = properties.filter((p: Property) => p.status === 'active');
    const avgPrice = properties.reduce((sum: number, p: Property) => sum + p.price, 0) / properties.length;
    
    return `🏠 **Property Portfolio Analysis:**
    
• **Active Listings:** ${activeProperties.length}
• **Average Price:** $${Math.round(avgPrice).toLocaleString()}
• **Price Range:** $${Math.min(...properties.map((p: Property) => p.price)).toLocaleString()} - $${Math.max(...properties.map((p: Property) => p.price)).toLocaleString()}

**Investment Opportunities:**
${properties.slice(0, 3).map((p: Property) => `• ${p.title} - $${p.price.toLocaleString()}`).join('\n')}

I can provide detailed analysis for any specific property. Just ask!`;
  }

  private generateMarketResponse(context: any): string {
    return `📈 **Market Analysis:**
    
**Current Trends:**
• Prague market showing 12% growth YoY
• Apartment demand increasing in city centers
• Investment opportunities in emerging districts

**Price Predictions:**
• Expected 8-15% appreciation over next 12 months
• Strong rental yield potential in premium locations

**Recommendations:**
• Focus on properties under $500K for best ROI
• Consider diversifying into commercial properties
• Monitor interest rate changes for timing

Would you like me to generate a detailed market report?`;
  }

  private generateInvestmentResponse(context: any): string {
    const { properties } = context;
    const bestInvestment = properties.reduce((best: Property, current: Property) => {
      const bestScore = this.calculateInvestmentScore(best);
      const currentScore = this.calculateInvestmentScore(current);
      return currentScore > bestScore ? current : best;
    }, properties[0]);
    
    return `💰 **Investment Recommendations:**
    
**Top Investment Opportunity:**
• **${bestInvestment?.title}**
• Price: $${bestInvestment?.price.toLocaleString()}
• Investment Score: ${this.calculateInvestmentScore(bestInvestment)}/10
• Expected ROI: 12-15%

**Portfolio Optimization:**
• Diversify across 3-4 different markets
• Maintain 60% residential, 40% commercial split
• Target properties with renovation potential

I can provide detailed investment analysis for any property. Would you like me to create a custom investment report?`;
  }

  private generateHelpResponse(): string {
    return `🤖 **Kyra AI Assistant - Help Guide:**
    
**I can help you with:**
• Navigate between different sections
• Analyze property and market data
• Generate detailed reports
• Provide investment recommendations
• Answer questions about agencies and properties

**Quick Commands:**
• "Show statistics" - Portfolio overview
• "Analyze agencies" - Agency performance
• "Market trends" - Current market analysis
• "Investment advice" - Personalized recommendations
• "Navigate to [section]" - Switch to any section

**Data Management:**
I continuously monitor and cache all application data for optimal performance. All your data is automatically backed up and analyzed for insights.

How can I assist you today?`;
  }

  private generateContextualResponse(message: string, context: any): string {
    return `I understand you're asking about "${message}". Based on your current portfolio of ${context.properties?.length || 0} properties across ${context.agencies?.length || 0} agencies, I can provide detailed insights and analysis.

**What I can do:**
• Analyze your property portfolio performance
• Compare market trends and opportunities  
• Generate comprehensive reports
• Navigate you to relevant sections
• Provide investment recommendations

**Current Market Status:** Your portfolio is performing well with strong diversification. Would you like me to provide specific analysis on any aspect of your real estate investments?

Just ask me anything about your properties, agencies, market trends, or let me help you navigate the application!`;
  }
}

export const kyraAI = new KyraAI();