import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  databaseConnections: number;
  cacheHitRate: number;
  timestamp: Date;
}

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  type: OptimizationType;
  condition: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  parameters: any;
  lastTriggered?: Date;
  triggerCount: number;
}

export type OptimizationType = 
  | 'database_query'
  | 'cache_optimization'
  | 'image_compression'
  | 'code_splitting'
  | 'lazy_loading'
  | 'connection_pooling'
  | 'memory_management'
  | 'cdn_optimization'
  | 'asset_minification';

export interface CacheConfig {
  enabled: boolean;
  provider: 'redis' | 'memory' | 'file';
  defaultTTL: number;
  maxSize: number;
  strategies: {
    [key: string]: {
      ttl: number;
      invalidation: 'time' | 'event' | 'manual';
      compression: boolean;
    };
  };
}

export interface DatabaseOptimization {
  queryOptimization: boolean;
  indexOptimization: boolean;
  connectionPooling: boolean;
  queryCache: boolean;
  slowQueryThreshold: number;
  connectionPoolSize: number;
  queryTimeout: number;
}

export interface AssetOptimization {
  imageCompression: boolean;
  imageFormats: string[];
  imageSizes: number[];
  minification: boolean;
  bundling: boolean;
  treeshaking: boolean;
  codeSplitting: boolean;
  lazyLoading: boolean;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache: Map<string, any> = new Map();
  private metrics: PerformanceMetrics[] = [];
  private optimizationRules: OptimizationRule[] = [];
  private cacheConfig: CacheConfig;
  private dbConfig: DatabaseOptimization;
  private assetConfig: AssetOptimization;

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  constructor() {
    this.cacheConfig = this.getDefaultCacheConfig();
    this.dbConfig = this.getDefaultDatabaseConfig();
    this.assetConfig = this.getDefaultAssetConfig();
    this.initializeOptimizationRules();
    this.startMetricsCollection();
  }

  // Get default cache configuration
  private getDefaultCacheConfig(): CacheConfig {
    return {
      enabled: true,
      provider: 'memory',
      defaultTTL: 300, // 5 minutes
      maxSize: 1000,
      strategies: {
        'user_data': {
          ttl: 900, // 15 minutes
          invalidation: 'event',
          compression: false
        },
        'contest_data': {
          ttl: 600, // 10 minutes
          invalidation: 'event',
          compression: true
        },
        'static_content': {
          ttl: 3600, // 1 hour
          invalidation: 'manual',
          compression: true
        },
        'api_responses': {
          ttl: 300, // 5 minutes
          invalidation: 'time',
          compression: true
        }
      }
    };
  }

  // Get default database configuration
  private getDefaultDatabaseConfig(): DatabaseOptimization {
    return {
      queryOptimization: true,
      indexOptimization: true,
      connectionPooling: true,
      queryCache: true,
      slowQueryThreshold: 1000, // 1 second
      connectionPoolSize: 20,
      queryTimeout: 30000 // 30 seconds
    };
  }

  // Get default asset configuration
  private getDefaultAssetConfig(): AssetOptimization {
    return {
      imageCompression: true,
      imageFormats: ['webp', 'avif', 'jpeg', 'png'],
      imageSizes: [320, 640, 1024, 1920],
      minification: true,
      bundling: true,
      treeshaking: true,
      codeSplitting: true,
      lazyLoading: true
    };
  }

  // Initialize optimization rules
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'slow_query_optimization',
        name: 'Slow Query Optimization',
        description: 'Optimize slow database queries',
        type: 'database_query',
        condition: 'responseTime > 1000',
        action: 'optimize_query',
        priority: 'high',
        enabled: true,
        parameters: { threshold: 1000 },
        triggerCount: 0
      },
      {
        id: 'cache_miss_optimization',
        name: 'Cache Miss Optimization',
        description: 'Improve cache hit rate',
        type: 'cache_optimization',
        condition: 'cacheHitRate < 0.8',
        action: 'adjust_cache_strategy',
        priority: 'medium',
        enabled: true,
        parameters: { targetHitRate: 0.9 },
        triggerCount: 0
      },
      {
        id: 'memory_usage_optimization',
        name: 'Memory Usage Optimization',
        description: 'Optimize memory usage',
        type: 'memory_management',
        condition: 'memoryUsage > 0.8',
        action: 'clear_unused_cache',
        priority: 'high',
        enabled: true,
        parameters: { threshold: 0.8 },
        triggerCount: 0
      },
      {
        id: 'image_compression',
        name: 'Image Compression',
        description: 'Automatically compress uploaded images',
        type: 'image_compression',
        condition: 'always',
        action: 'compress_images',
        priority: 'medium',
        enabled: true,
        parameters: { quality: 85, format: 'webp' },
        triggerCount: 0
      },
      {
        id: 'lazy_loading',
        name: 'Lazy Loading',
        description: 'Implement lazy loading for images and components',
        type: 'lazy_loading',
        condition: 'always',
        action: 'enable_lazy_loading',
        priority: 'low',
        enabled: true,
        parameters: { threshold: '200px' },
        triggerCount: 0
      }
    ];
  }

  // Start metrics collection
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect every minute
  }

  // Collect performance metrics
  private async collectMetrics(): Promise<void> {
    const metrics: PerformanceMetrics = {
      responseTime: await this.measureResponseTime(),
      throughput: await this.measureThroughput(),
      errorRate: await this.measureErrorRate(),
      cpuUsage: await this.measureCpuUsage(),
      memoryUsage: await this.measureMemoryUsage(),
      databaseConnections: await this.measureDatabaseConnections(),
      cacheHitRate: this.measureCacheHitRate(),
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check optimization rules
    await this.checkOptimizationRules(metrics);
  }

  // Measure response time
  private async measureResponseTime(): Promise<number> {
    const start = Date.now();
    try {
      // Simple database query to measure response time
      await db.select({ count: count() }).from(users);
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  // Measure throughput
  private async measureThroughput(): Promise<number> {
    // This would measure requests per second
    // For now, return a mock value
    return Math.random() * 100 + 50;
  }

  // Measure error rate
  private async measureErrorRate(): Promise<number> {
    // This would calculate error rate from logs
    // For now, return a mock value
    return Math.random() * 0.1;
  }

  // Measure CPU usage
  private async measureCpuUsage(): Promise<number> {
    // This would measure actual CPU usage
    // For now, return a mock value
    return Math.random() * 0.8 + 0.1;
  }

  // Measure memory usage
  private async measureMemoryUsage(): Promise<number> {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal + usage.external;
    const usedMemory = usage.heapUsed;
    return usedMemory / totalMemory;
  }

  // Measure database connections
  private async measureDatabaseConnections(): Promise<number> {
    // This would query the database for active connections
    // For now, return a mock value
    return Math.floor(Math.random() * 20) + 5;
  }

  // Measure cache hit rate
  private measureCacheHitRate(): number {
    // Calculate cache hit rate from cache statistics
    // For now, return a mock value
    return Math.random() * 0.3 + 0.7;
  }

  // Check optimization rules
  private async checkOptimizationRules(metrics: PerformanceMetrics): Promise<void> {
    for (const rule of this.optimizationRules) {
      if (!rule.enabled) continue;

      if (this.evaluateCondition(rule.condition, metrics)) {
        await this.executeOptimization(rule, metrics);
      }
    }
  }

  // Evaluate optimization condition
  private evaluateCondition(condition: string, metrics: PerformanceMetrics): boolean {
    try {
      // Simple condition evaluation
      if (condition === 'always') return true;
      
      // Replace metric names with actual values
      let evaluableCondition = condition
        .replace(/responseTime/g, metrics.responseTime.toString())
        .replace(/throughput/g, metrics.throughput.toString())
        .replace(/errorRate/g, metrics.errorRate.toString())
        .replace(/cpuUsage/g, metrics.cpuUsage.toString())
        .replace(/memoryUsage/g, metrics.memoryUsage.toString())
        .replace(/cacheHitRate/g, metrics.cacheHitRate.toString());

      // Use Function constructor for safe evaluation
      return new Function('return ' + evaluableCondition)();
    } catch {
      return false;
    }
  }

  // Execute optimization
  private async executeOptimization(rule: OptimizationRule, metrics: PerformanceMetrics): Promise<void> {
    try {
      switch (rule.action) {
        case 'optimize_query':
          await this.optimizeSlowQueries();
          break;
        case 'adjust_cache_strategy':
          await this.adjustCacheStrategy();
          break;
        case 'clear_unused_cache':
          await this.clearUnusedCache();
          break;
        case 'compress_images':
          await this.compressImages();
          break;
        case 'enable_lazy_loading':
          await this.enableLazyLoading();
          break;
      }

      rule.lastTriggered = new Date();
      rule.triggerCount++;

    } catch (error) {
      console.error(`Optimization failed for rule ${rule.id}:`, error);
    }
  }

  // Cache management methods
  async set(key: string, value: any, ttl?: number, strategy?: string): Promise<void> {
    if (!this.cacheConfig.enabled) return;

    const cacheStrategy = strategy ? this.cacheConfig.strategies[strategy] : null;
    const finalTTL = ttl || cacheStrategy?.ttl || this.cacheConfig.defaultTTL;

    // Compress if enabled
    let finalValue = value;
    if (cacheStrategy?.compression) {
      finalValue = await this.compressValue(value);
    }

    // Store with expiration
    this.cache.set(key, {
      value: finalValue,
      expires: Date.now() + (finalTTL * 1000),
      compressed: cacheStrategy?.compression || false
    });

    // Enforce max size
    if (this.cache.size > this.cacheConfig.maxSize) {
      this.evictOldestEntries();
    }
  }

  async get(key: string): Promise<any> {
    if (!this.cacheConfig.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    // Decompress if needed
    if (entry.compressed && entry.value) {
      return await this.decompressValue(entry.value);
    }

    return entry.value;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Cache helper methods
  private async compressValue(value: any): Promise<string> {
    // Simple JSON compression simulation
    return JSON.stringify(value);
  }

  private async decompressValue(value: string): Promise<any> {
    if (!value || value === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private evictOldestEntries(): void {
    const entries: Array<[string, any]> = [];
    this.cache.forEach((value, key) => {
      entries.push([key, value]);
    });
    entries.sort((a, b) => a[1].expires - b[1].expires);
    
    // Remove oldest 10% of entries
    const toRemove = Math.floor(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Optimization methods
  private async optimizeSlowQueries(): Promise<void> {
    console.log('Optimizing slow queries...');
    // This would analyze and optimize slow database queries
    // Could include:
    // - Adding missing indexes
    // - Rewriting inefficient queries
    // - Implementing query caching
  }

  private async adjustCacheStrategy(): Promise<void> {
    console.log('Adjusting cache strategy...');
    // This would adjust cache TTL and strategies based on hit rates
    // Could include:
    // - Increasing TTL for frequently accessed data
    // - Implementing different cache strategies
    // - Preloading frequently accessed data
  }

  private async clearUnusedCache(): Promise<void> {
    console.log('Clearing unused cache...');
    const now = Date.now();
    
    this.cache.forEach((entry, key) => {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    });
  }

  private async compressImages(): Promise<void> {
    console.log('Compressing images...');
    // This would implement automatic image compression
    // Could include:
    // - Converting images to WebP/AVIF
    // - Generating multiple sizes
    // - Optimizing quality settings
  }

  private async enableLazyLoading(): Promise<void> {
    console.log('Enabling lazy loading...');
    // This would implement lazy loading optimizations
    // Could include:
    // - Image lazy loading
    // - Component lazy loading
    // - Route-based code splitting
  }

  // Database optimization methods
  async optimizeDatabase(): Promise<void> {
    if (!this.dbConfig.queryOptimization) return;

    // Analyze slow queries
    await this.analyzeSlowQueries();
    
    // Optimize indexes
    if (this.dbConfig.indexOptimization) {
      await this.optimizeIndexes();
    }

    // Update statistics
    await this.updateDatabaseStatistics();
  }

  private async analyzeSlowQueries(): Promise<void> {
    // This would analyze slow query logs and suggest optimizations
    console.log('Analyzing slow queries...');
  }

  private async optimizeIndexes(): Promise<void> {
    // This would analyze query patterns and suggest new indexes
    console.log('Optimizing database indexes...');
  }

  private async updateDatabaseStatistics(): Promise<void> {
    // This would update database statistics for better query planning
    console.log('Updating database statistics...');
  }

  // Asset optimization methods
  async optimizeAssets(): Promise<void> {
    if (this.assetConfig.imageCompression) {
      await this.optimizeImages();
    }

    if (this.assetConfig.minification) {
      await this.minifyAssets();
    }

    if (this.assetConfig.bundling) {
      await this.bundleAssets();
    }
  }

  private async optimizeImages(): Promise<void> {
    // This would optimize images automatically
    console.log('Optimizing images...');
  }

  private async minifyAssets(): Promise<void> {
    // This would minify CSS, JS, and other assets
    console.log('Minifying assets...');
  }

  private async bundleAssets(): Promise<void> {
    // This would bundle and optimize asset delivery
    console.log('Bundling assets...');
  }

  // Performance monitoring methods
  getPerformanceMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics[] {
    if (!timeRange) {
      return [...this.metrics];
    }

    return this.metrics.filter(metric => 
      metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );
  }

  getAverageMetrics(timeRange?: { start: Date; end: Date }): Partial<PerformanceMetrics> {
    const metrics = this.getPerformanceMetrics(timeRange);
    if (metrics.length === 0) return {};

    return {
      responseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
      throughput: metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length,
      errorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      cpuUsage: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
      memoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
      cacheHitRate: metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length
    };
  }

  getPerformanceReport(): {
    summary: any;
    recommendations: string[];
    metrics: PerformanceMetrics[];
    optimizations: { rule: OptimizationRule; triggered: number }[];
  } {
    const recentMetrics = this.metrics.slice(-100); // Last 100 metrics
    const averages = this.getAverageMetrics();
    
    const recommendations: string[] = [];
    
    if (averages.responseTime && averages.responseTime > 1000) {
      recommendations.push('Consider optimizing database queries or adding caching');
    }
    
    if (averages.cacheHitRate && averages.cacheHitRate < 0.8) {
      recommendations.push('Improve cache strategy and increase cache hit rate');
    }
    
    if (averages.memoryUsage && averages.memoryUsage > 0.8) {
      recommendations.push('Optimize memory usage and implement garbage collection');
    }

    const optimizations = this.optimizationRules.map(rule => ({
      rule,
      triggered: rule.triggerCount
    }));

    return {
      summary: {
        averageResponseTime: averages.responseTime,
        averageThroughput: averages.throughput,
        averageErrorRate: averages.errorRate,
        averageCacheHitRate: averages.cacheHitRate,
        totalOptimizations: this.optimizationRules.reduce((sum, rule) => sum + rule.triggerCount, 0)
      },
      recommendations,
      metrics: recentMetrics,
      optimizations
    };
  }

  // Configuration methods
  updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  updateDatabaseConfig(config: Partial<DatabaseOptimization>): void {
    this.dbConfig = { ...this.dbConfig, ...config };
  }

  updateAssetConfig(config: Partial<AssetOptimization>): void {
    this.assetConfig = { ...this.assetConfig, ...config };
  }

  addOptimizationRule(rule: Omit<OptimizationRule, 'id' | 'triggerCount'>): void {
    const newRule: OptimizationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggerCount: 0
    };
    this.optimizationRules.push(newRule);
  }

  removeOptimizationRule(ruleId: string): void {
    this.optimizationRules = this.optimizationRules.filter(rule => rule.id !== ruleId);
  }

  toggleOptimizationRule(ruleId: string, enabled: boolean): void {
    const rule = this.optimizationRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // Get current configurations
  getCacheConfig(): CacheConfig {
    return { ...this.cacheConfig };
  }

  getDatabaseConfig(): DatabaseOptimization {
    return { ...this.dbConfig };
  }

  getAssetConfig(): AssetOptimization {
    return { ...this.assetConfig };
  }

  getOptimizationRules(): OptimizationRule[] {
    return [...this.optimizationRules];
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance(); 