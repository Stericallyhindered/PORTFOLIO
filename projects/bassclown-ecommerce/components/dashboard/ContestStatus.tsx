'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Users, Award } from 'lucide-react';

interface Contest {
  id: string;
  title: string;
  deadline: string;
  prize: string;
  participants: number;
  status: 'Active' | 'Submitted' | 'Judging' | 'Closed';
  submitted: boolean;
}

export const ContestStatus = () => {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContests() {
      try {
        const response = await fetch('/api/dashboard/contests');
        const data = await response.json();
        if (data.success) {
          setContests(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch contests:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Submitted': return 'bg-blue-500';
      case 'Judging': return 'bg-yellow-500';
      case 'Closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Contest Status</span>
        </CardTitle>
        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
          View All Contests
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-gray-400 text-center py-4">Loading...</div>
        ) : contests.length === 0 ? (
          <div className="text-gray-400 text-center py-4">No active contests</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contests.map((contest) => (
            <div key={contest.id} className="p-4 bg-[#1A1A1A] rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-white text-sm">{contest.title}</h3>
                <Badge className={`${getStatusColor(contest.status)} text-white text-xs`}>
                  {contest.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Calendar size={12} />
                  <span>Deadline: {contest.deadline}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award size={12} />
                  <span>Prize: {contest.prize}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={12} />
                  <span>{contest.participants} participants</span>
                </div>
              </div>
              
              <div className="mt-4">
                {contest.submitted ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <div className="h-2 w-2 bg-green-400 rounded-full" />
                    <span className="text-xs">Submitted</span>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={contest.status === 'Closed'}
                    onClick={() => router.push(`/contests/${contest.id}`)}
                  >
                    {contest.status === 'Closed' ? 'Contest Closed' : 'Submit Entry'}
                  </Button>
                )}
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 