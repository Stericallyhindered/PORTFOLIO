import { db, contests, giveaways, users, contestSubmissions, contestApplications } from '@/lib/db';
import { eq, and, or, like, ilike, gte, lte, desc, asc, count, sql } from 'drizzle-orm';

export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  prizeRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  location?: string;
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'prize' | 'popularity' | 'deadline';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: 'contest' | 'giveaway' | 'user' | 'submission';
  title: string;
  description?: string;
  imageUrl?: string;
  score?: number; // relevance score
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  filters: {
    categories: Array<{ value: string; count: number; label: string }>;
    statuses: Array<{ value: string; count: number; label: string }>;
    prizeRanges: Array<{ min: number; max: number; count: number; label: string }>;
    tags: Array<{ value: string; count: number }>;
  };
  suggestions?: string[];
}

class SearchService {

  /**
   * Perform comprehensive search across all content types
   */
  async search(filters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      const results: SearchResult[] = [];
      let totalCount = 0;

      // Search contests
      if (!filters.query || this.shouldSearchType('contest', filters.query)) {
        const contestResults = await this.searchContests(filters);
        results.push(...contestResults.results);
        totalCount += contestResults.totalCount;
      }

      // Search giveaways
      if (!filters.query || this.shouldSearchType('giveaway', filters.query)) {
        const giveawayResults = await this.searchGiveaways(filters);
        results.push(...giveawayResults.results);
        totalCount += giveawayResults.totalCount;
      }

      // Search users
      if (!filters.query || this.shouldSearchType('user', filters.query)) {
        const userResults = await this.searchUsers(filters);
        results.push(...userResults.results);
        totalCount += userResults.totalCount;
      }

      // Sort results by relevance/specified criteria
      const sortedResults = this.sortResults(results, filters);

      // Apply pagination
      const paginatedResults = this.paginateResults(sortedResults, filters);

      // Generate filter aggregations
      const filterAggregations = await this.generateFilterAggregations(filters);

      // Generate search suggestions
      const suggestions = await this.generateSuggestions(filters.query);

      return {
        results: paginatedResults,
        totalCount,
        filters: filterAggregations,
        suggestions
      };

    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  }

  /**
   * Search contests with advanced filtering
   */
  async searchContests(filters: SearchFilters): Promise<{ results: SearchResult[]; totalCount: number }> {
    try {
      const conditions = [];
      
      // Text search
      if (filters.query) {
        conditions.push(
          or(
            ilike(contests.title, `%${filters.query}%`),
            ilike(contests.description, `%${filters.query}%`),
            ilike(contests.category, `%${filters.query}%`)
          )
        );
      }

      // Status filter
      if (filters.status) {
        conditions.push(eq(contests.status, filters.status));
      }

      // Category filter
      if (filters.category) {
        conditions.push(eq(contests.category, filters.category));
      }

      // Date range filter
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          conditions.push(gte(contests.startDate, filters.dateRange.start));
        }
        if (filters.dateRange.end) {
          conditions.push(lte(contests.endDate, filters.dateRange.end));
        }
      }

      // Prize range filter (assuming prize value is stored as string, we'll need to parse)
      if (filters.prizeRange) {
        // This would need custom logic to parse prize values
        // For now, we'll skip this complex filter
      }

      // Build query
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(contests)
        .where(whereClause);

      // Get results with sorting
      let orderBy;
      switch (filters.sortBy) {
        case 'date':
          orderBy = filters.sortOrder === 'asc' ? asc(contests.createdAt) : desc(contests.createdAt);
          break;
        case 'deadline':
          orderBy = filters.sortOrder === 'asc' ? asc(contests.endDate) : desc(contests.endDate);
          break;
        default:
          orderBy = desc(contests.createdAt);
      }

      const contestsData = await db
        .select({
          id: contests.id,
          title: contests.title,
          description: contests.description,
          category: contests.category,
          status: contests.status,
          prize: contests.prize,
          startDate: contests.startDate,
          endDate: contests.endDate,
          image: contests.image,
          createdAt: contests.createdAt,
          updatedAt: contests.updatedAt
        })
        .from(contests)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      const results: SearchResult[] = contestsData.map(contest => ({
        id: contest.id,
        type: 'contest' as const,
        title: contest.title,
        description: contest.description || undefined,
        imageUrl: contest.image || undefined,
        score: this.calculateRelevanceScore(contest.title, contest.description, filters.query),
        metadata: {
          category: contest.category,
          status: contest.status,
          prize: contest.prize,
          startDate: contest.startDate,
          endDate: contest.endDate
        },
        createdAt: contest.createdAt || new Date(),
        updatedAt: contest.updatedAt || undefined
      }));

      return {
        results,
        totalCount: countResult.count
      };

    } catch (error) {
      console.error('Error searching contests:', error);
      throw error;
    }
  }

  /**
   * Search giveaways with advanced filtering
   */
  async searchGiveaways(filters: SearchFilters): Promise<{ results: SearchResult[]; totalCount: number }> {
    try {
      const conditions = [];
      
      // Text search
      if (filters.query) {
        conditions.push(
          or(
            ilike(giveaways.title, `%${filters.query}%`),
            ilike(giveaways.description, `%${filters.query}%`)
          )
        );
      }

      // Status filter
      if (filters.status) {
        conditions.push(eq(giveaways.status, filters.status));
      }

      // Date range filter
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          conditions.push(gte(giveaways.startDate, filters.dateRange.start));
        }
        if (filters.dateRange.end) {
          conditions.push(lte(giveaways.endDate, filters.dateRange.end));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(giveaways)
        .where(whereClause);

      // Get results
      let orderBy;
      switch (filters.sortBy) {
        case 'date':
          orderBy = filters.sortOrder === 'asc' ? asc(giveaways.createdAt) : desc(giveaways.createdAt);
          break;
        case 'deadline':
          orderBy = filters.sortOrder === 'asc' ? asc(giveaways.endDate) : desc(giveaways.endDate);
          break;
        default:
          orderBy = desc(giveaways.createdAt);
      }

      const giveawaysData = await db
        .select({
          id: giveaways.id,
          title: giveaways.title,
          description: giveaways.description,
          status: giveaways.status,
          prizeValue: giveaways.prizeValue,
          startDate: giveaways.startDate,
          endDate: giveaways.endDate,
          image: giveaways.image,
          sponsor: giveaways.sponsor,
          createdAt: giveaways.createdAt,
          updatedAt: giveaways.updatedAt
        })
        .from(giveaways)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      const results: SearchResult[] = giveawaysData.map(giveaway => ({
        id: giveaway.id,
        type: 'giveaway' as const,
        title: giveaway.title,
        description: giveaway.description || undefined,
        imageUrl: giveaway.image || undefined,
        score: this.calculateRelevanceScore(giveaway.title, giveaway.description, filters.query),
        metadata: {
          status: giveaway.status,
          prizeValue: giveaway.prizeValue,
          startDate: giveaway.startDate,
          endDate: giveaway.endDate,
          sponsor: giveaway.sponsor
        },
        createdAt: giveaway.createdAt || new Date(),
        updatedAt: giveaway.updatedAt || undefined
      }));

      return {
        results,
        totalCount: countResult.count
      };

    } catch (error) {
      console.error('Error searching giveaways:', error);
      throw error;
    }
  }

  /**
   * Search users with advanced filtering
   */
  async searchUsers(filters: SearchFilters): Promise<{ results: SearchResult[]; totalCount: number }> {
    try {
      const conditions = [];
      
      // Text search
      if (filters.query) {
        conditions.push(
          or(
            ilike(users.name, `%${filters.query}%`),
            ilike(users.email, `%${filters.query}%`),
            ilike(users.bio, `%${filters.query}%`)
          )
        );
      }

      // Role filter (if status is used for role filtering)
      if (filters.status) {
        conditions.push(eq(users.role, filters.status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(users)
        .where(whereClause);

      // Get results
      const orderBy = filters.sortOrder === 'asc' ? asc(users.createdAt) : desc(users.createdAt);

      const usersData = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          bio: users.bio,
          role: users.role,
          avatar: users.avatar,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      const results: SearchResult[] = usersData.map(user => ({
        id: user.id,
        type: 'user' as const,
        title: user.name || 'Anonymous User',
        description: user.bio || undefined,
        imageUrl: user.avatar || undefined,
        score: this.calculateRelevanceScore(user.name || undefined, user.bio || undefined, filters.query),
        metadata: {
          email: user.email,
          role: user.role
        },
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || undefined
      }));

      return {
        results,
        totalCount: countResult.count
      };

    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Generate filter aggregations for faceted search
   */
  async generateFilterAggregations(filters: SearchFilters): Promise<SearchResponse['filters']> {
    try {
      // Get contest categories
      const contestCategories = await db
        .select({
          category: contests.category,
          count: count()
        })
        .from(contests)
        .where(eq(contests.status, 'active'))
        .groupBy(contests.category);

      // Get contest statuses
      const contestStatuses = await db
        .select({
          status: contests.status,
          count: count()
        })
        .from(contests)
        .groupBy(contests.status);

      // Get giveaway statuses
      const giveawayStatuses = await db
        .select({
          status: giveaways.status,
          count: count()
        })
        .from(giveaways)
        .groupBy(giveaways.status);

      return {
        categories: contestCategories.map(cat => ({
          value: cat.category || 'uncategorized',
          count: cat.count,
          label: cat.category || 'Uncategorized'
        })),
        statuses: [
          ...contestStatuses.map(status => ({
            value: status.status || 'unknown',
            count: status.count,
            label: status.status || 'Unknown'
          })),
          ...giveawayStatuses.map(status => ({
            value: status.status || 'unknown',
            count: status.count,
            label: status.status || 'Unknown'
          }))
        ],
        prizeRanges: [
          { min: 0, max: 100, count: 0, label: 'Under $100' },
          { min: 100, max: 500, count: 0, label: '$100 - $500' },
          { min: 500, max: 1000, count: 0, label: '$500 - $1,000' },
          { min: 1000, max: 5000, count: 0, label: '$1,000 - $5,000' },
          { min: 5000, max: 999999, count: 0, label: 'Over $5,000' }
        ],
        tags: [] // Would be populated from a tags system if implemented
      };

    } catch (error) {
      console.error('Error generating filter aggregations:', error);
      return {
        categories: [],
        statuses: [],
        prizeRanges: [],
        tags: []
      };
    }
  }

  /**
   * Generate search suggestions based on query
   */
  async generateSuggestions(query?: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Get popular contest titles that match the query
      const contestSuggestions = await db
        .select({ title: contests.title })
        .from(contests)
        .where(ilike(contests.title, `%${query}%`))
        .limit(5);

      // Get popular categories that match the query
      const categorySuggestions = await db
        .select({ category: contests.category })
        .from(contests)
        .where(ilike(contests.category, `%${query}%`))
        .groupBy(contests.category)
        .limit(3);

      const suggestions = [
        ...contestSuggestions.map(c => c.title),
        ...categorySuggestions.map(c => c.category || '')
      ].filter(s => s && s.length > 0);

      return Array.from(new Set(suggestions)).slice(0, 8);

    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  // Private helper methods

  private shouldSearchType(type: string, query?: string): boolean {
    if (!query) return true;
    
    // Simple heuristic to determine if query is relevant to content type
    const typeKeywords = {
      contest: ['contest', 'competition', 'challenge', 'tournament'],
      giveaway: ['giveaway', 'prize', 'win', 'free', 'drawing'],
      user: ['user', 'creator', 'artist', 'angler', 'fisher']
    };

    const keywords = typeKeywords[type as keyof typeof typeKeywords] || [];
    const queryLower = query.toLowerCase();
    
    return keywords.some(keyword => queryLower.includes(keyword)) || 
           !Object.values(typeKeywords).flat().some(keyword => queryLower.includes(keyword));
  }

  private calculateRelevanceScore(title?: string, description?: string, query?: string): number {
    if (!query) return 1;

    let score = 0;
    const queryLower = query.toLowerCase();

    // Title exact match gets highest score
    if (title && title.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Description match gets lower score
    if (description && description.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // Word boundary matches get bonus
    if (title && new RegExp(`\\b${queryLower}\\b`, 'i').test(title)) {
      score += 5;
    }

    return Math.max(score, 1);
  }

  private sortResults(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    const sortBy = filters.sortBy || 'relevance';
    const sortOrder = filters.sortOrder || 'desc';

    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = (b.score || 0) - (a.score || 0);
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'popularity':
          // Could be based on view count, application count, etc.
          comparison = 0;
          break;
        default:
          comparison = a.title.localeCompare(b.title);
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }

  private paginateResults(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    return results.slice(offset, offset + limit);
  }
}

export const searchService = new SearchService(); 