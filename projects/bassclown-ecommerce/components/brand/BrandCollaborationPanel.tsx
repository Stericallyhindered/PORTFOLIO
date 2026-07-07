'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Star,
  MessageSquare,
  Eye,
  Edit,
  Send,
  CheckCircle,
} from 'lucide-react';

interface BrandContest {
  id: string;
  title: string;
  status: string;
  brandName: string | null;
  prize: string | null;
  currentParticipants: number;
  maxParticipants: number;
  startDate: string | null;
  endDate: string | null;
}

interface BrandGiveaway {
  id: string;
  title: string;
  status: string;
  sponsor: string | null;
  prizeValue: string | null;
  entryCount: number;
  startDate: string | null;
  endDate: string | null;
}

export default function BrandCollaborationPanel() {
  const [activeTab, setActiveTab] = useState('contests');
  const [contests, setContests] = useState<BrandContest[]>([]);
  const [giveaways, setGiveaways] = useState<BrandGiveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch contests
      const contestsRes = await fetch('/api/contests?limit=100', { credentials: 'include' });
      if (contestsRes.ok) {
        const result = await contestsRes.json();
        if (result.success && result.data?.contests) {
          setContests(result.data.contests.map((c: any) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            brandName: c.brandName || null,
            prize: c.prize || null,
            currentParticipants: c.currentParticipants || 0,
            maxParticipants: c.maxParticipants || 0,
            startDate: c.startDate || null,
            endDate: c.endDate || null,
          })));
        }
      }

      // Fetch giveaways
      const giveawaysRes = await fetch('/api/giveaways?limit=100', { credentials: 'include' });
      if (giveawaysRes.ok) {
        const result = await giveawaysRes.json();
        if (result.success && result.data?.giveaways) {
          setGiveaways(result.data.giveaways.map((g: any) => ({
            id: g.id,
            title: g.title,
            status: g.status,
            sponsor: g.sponsor || null,
            prizeValue: g.prizeValue || null,
            entryCount: g.entryCount || 0,
            startDate: g.startDate || null,
            endDate: g.endDate || null,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'judging': return 'bg-yellow-100 text-yellow-800';
      case 'ended': case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContests = contests.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.brandName && c.brandName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredGiveaways = giveaways.filter(g =>
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.sponsor && g.sponsor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Derive brand stats from real data
  const uniqueBrands = new Set([
    ...contests.filter(c => c.brandName).map(c => c.brandName),
    ...giveaways.filter(g => g.sponsor).map(g => g.sponsor),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Brand Collaborations</h2>
          <p className="text-gray-600">Contests and giveaways with brand partners</p>
        </div>
      </div>

      {/* Stats from real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Contests</p>
                <p className="text-2xl font-bold">{contests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Giveaways</p>
                <p className="text-2xl font-bold">{giveaways.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Brand Partners</p>
                <p className="text-2xl font-bold">{uniqueBrands.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {contests.filter(c => c.status === 'open').length + giveaways.filter(g => g.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="contests">Contests ({contests.length})</TabsTrigger>
          <TabsTrigger value="giveaways">Giveaways ({giveaways.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contests" className="space-y-4">
          {loading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : filteredContests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No contests found</div>
          ) : (
            <div className="space-y-4">
              {filteredContests.map((contest) => (
                <Card key={contest.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{contest.title}</h3>
                          <Badge className={getStatusColor(contest.status)}>{contest.status}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {contest.brandName && (
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {contest.brandName}
                            </span>
                          )}
                          {contest.prize && (
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {contest.prize}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {contest.currentParticipants}{contest.maxParticipants > 0 ? `/${contest.maxParticipants}` : ''} participants
                          </span>
                          {contest.endDate && (
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Ends {new Date(contest.endDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/contests/${contest.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Manage
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="giveaways" className="space-y-4">
          {loading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : filteredGiveaways.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No giveaways found</div>
          ) : (
            <div className="space-y-4">
              {filteredGiveaways.map((giveaway) => (
                <Card key={giveaway.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{giveaway.title}</h3>
                          <Badge className={getStatusColor(giveaway.status)}>{giveaway.status}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {giveaway.sponsor && (
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {giveaway.sponsor}
                            </span>
                          )}
                          {giveaway.prizeValue && (
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {giveaway.prizeValue}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {giveaway.entryCount} entries
                          </span>
                          {giveaway.endDate && (
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Ends {new Date(giveaway.endDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/giveaways/${giveaway.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Manage
                        </a>
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
  );
}
