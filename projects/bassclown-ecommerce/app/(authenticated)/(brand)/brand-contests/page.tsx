'use client';

import { useState, useEffect } from 'react';
import { Contest, ContestCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContestCard from '@/components/contests/ContestCard';
import { Search, Filter, Trophy, Calendar, Users, Plus, Edit, Eye, BarChart3 } from 'lucide-react';

export default function BrandContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContests() {
      try {
        const response = await fetch('/api/brand/contests');
        const data = await response.json();
        if (data.success) {
          setContests(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch brand contests:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContests();
  }, []);

  useEffect(() => {
    filterContests();
  }, [searchTerm, selectedStatus, activeTab, contests]);

  const filterContests = () => {
    let filtered = contests;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(contest =>
        contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(contest => contest.status === selectedStatus);
    }

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(contest => contest.status === activeTab);
    }

    setFilteredContests(filtered);
  };

  const getContestCounts = () => {
    return {
      all: contests.length,
      open: contests.filter(c => c.status === 'open').length,
      judging: contests.filter(c => c.status === 'judging').length,
      completed: contests.filter(c => c.status === 'completed').length,
      draft: contests.filter(c => c.status === 'draft').length,
    };
  };

  const counts = getContestCounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brand Contests</h1>
            <p className="text-gray-600 mt-2">Manage your contests and campaigns</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Contest
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="judging">Judging</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="open" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Open ({counts.open})
            </TabsTrigger>
            <TabsTrigger value="judging" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Judging ({counts.judging})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Completed ({counts.completed})
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Draft ({counts.draft})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredContests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No contests found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by creating your first contest.'}
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Contest
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContests.map((contest) => (
                  <div key={contest.id} className="relative">
                    <ContestCard contest={contest} />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 