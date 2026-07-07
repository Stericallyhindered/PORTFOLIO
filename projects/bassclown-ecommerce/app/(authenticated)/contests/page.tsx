'use client';

import { useState, useEffect } from 'react';
import { Contest, ContestCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ContestCard from '@/components/contests/ContestCard';
import { Search, Filter, Trophy, Calendar, Users, DollarSign, Tag, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch contests from API
  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all contests (using a large limit to get all)
      const response = await fetch('/api/contests?limit=100', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contests: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.contests) {
        // Transform API data to match Contest type
        const transformedContests: Contest[] = result.data.contests.map((contest: any) => ({
          id: contest.id,
          title: contest.title,
          description: contest.description || '',
          shortDescription: contest.shortDescription || contest.description?.substring(0, 100) || '',
          image: contest.image || '/images/assets/bass-clown-co-fish-chase.png',
          prize: contest.prize || 'Prize TBD',
          startDate: contest.startDate ? new Date(contest.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: contest.endDate ? new Date(contest.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          applicationDeadline: contest.applicationDeadline ? new Date(contest.applicationDeadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          submissionDeadline: contest.submissionDeadline ? new Date(contest.submissionDeadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: contest.status || 'open',
          category: contest.category || 'General',
          requirements: Array.isArray(contest.requirements) ? contest.requirements : 
                        typeof contest.requirements === 'object' && contest.requirements !== null 
                          ? Object.values(contest.requirements) as string[]
                          : [],
          judges: Array.isArray(contest.judges) ? contest.judges : 
                  typeof contest.judges === 'object' && contest.judges !== null
                    ? Object.values(contest.judges) as string[]
                    : [],
          maxParticipants: contest.maxParticipants || 100,
          currentParticipants: contest.currentParticipants || 0,
          rules: contest.rules || '',
          submissionGuidelines: contest.submissionGuidelines || '',
          createdBy: contest.createdBy || contest.creatorName || 'Bass Clown Co',
          createdAt: contest.createdAt ? new Date(contest.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: contest.updatedAt ? new Date(contest.updatedAt).toISOString() : new Date().toISOString()
        }));
        
        setContests(transformedContests);
        setFilteredContests(transformedContests);
      } else {
        throw new Error(result.message || 'Failed to fetch contests');
      }
    } catch (err) {
      console.error('Error fetching contests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching contests');
      toast({
        title: "Error",
        description: "Failed to load contests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterContests();
  }, [searchTerm, selectedCategory, selectedStatus, activeTab, contests]);

  const filterContests = () => {
    let filtered = [...contests];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(contest =>
        contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(contest => contest.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(contest => contest.status === selectedStatus);
    }

    // Filter by tab
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'open':
          filtered = filtered.filter(contest => contest.status === 'open');
          break;
        case 'closing-soon':
          filtered = filtered.filter(contest => {
            const deadline = new Date(contest.applicationDeadline);
            const now = new Date();
            const timeDiff = deadline.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff <= 7 && daysDiff > 0 && contest.status === 'open';
          });
          break;
        case 'judging':
          filtered = filtered.filter(contest => contest.status === 'judging');
          break;
        case 'completed':
          filtered = filtered.filter(contest => contest.status === 'completed');
          break;
      }
    }

    setFilteredContests(filtered);
  };

  const getContestCounts = () => {
    return {
      all: contests.length,
      open: contests.filter(c => c.status === 'open').length,
      closingSoon: contests.filter(c => {
        const deadline = new Date(c.applicationDeadline);
        const now = new Date();
        const timeDiff = deadline.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff <= 7 && daysDiff > 0 && c.status === 'open';
      }).length,
      judging: contests.filter(c => c.status === 'judging').length,
      completed: contests.filter(c => c.status === 'completed').length,
    };
  };

  // Get unique categories from contests
  const categories = Array.from(new Set(contests.map(c => c.category).filter(Boolean)));

  const counts = getContestCounts();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && contests.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-[#2D2D2D] border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchContests}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Contest Discovery</h1>
          <p className="text-gray-400 mb-6">
            Discover and participate in exciting fishing contests. Show off your skills and win amazing prizes!
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-400">Total Contests</p>
                    <p className="text-2xl font-bold text-white">{counts.all}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-400">Open Now</p>
                    <p className="text-2xl font-bold text-white">{counts.open}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-400">Closing Soon</p>
                    <p className="text-2xl font-bold text-white">{counts.closingSoon}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-400">Total Prizes</p>
                    <p className="text-2xl font-bold text-white">${contests.reduce((sum, c) => {
                      const prizeMatch = c.prize?.match(/\$?(\d+)/);
                      return sum + (prizeMatch ? parseInt(prizeMatch[1]) : 0);
                    }, 0).toLocaleString()}+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#2D2D2D] border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-[#2D2D2D] border-gray-700 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#2D2D2D] border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48 bg-[#2D2D2D] border-gray-700 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-[#2D2D2D] border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="judging">Judging</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-[#2D2D2D]">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
            <TabsTrigger value="closing-soon">Closing Soon ({counts.closingSoon})</TabsTrigger>
            <TabsTrigger value="judging">Judging ({counts.judging})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {filteredContests.length === 0 ? (
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No contests found</h3>
                  <p className="text-gray-400">
                    {contests.length === 0 
                      ? 'No contests available at the moment. Check back soon!'
                      : 'Try adjusting your filters or search terms to find contests.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContests.map((contest) => (
                  <Card key={contest.id} className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D] transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-white">{contest.title}</CardTitle>
                          <CardDescription className="text-gray-400 line-clamp-2">{contest.shortDescription || contest.description}</CardDescription>
                        </div>
                        <Badge variant={contest.status === 'open' ? 'default' : 'secondary'}>
                          {contest.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span>Prize: {contest.prize}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{contest.currentParticipants} / {contest.maxParticipants || '∞'} participants</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Apply by {new Date(contest.applicationDeadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Tag className="w-4 h-4" />
                          <span>{contest.category}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button asChild className="w-full">
                          <Link href={`/contests/${contest.id}`}>
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}