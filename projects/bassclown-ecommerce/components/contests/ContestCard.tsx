'use client';

import { Contest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ContestCardProps {
  contest: Contest;
}

const getStatusColor = (status: Contest['status']) => {
  switch (status) {
    case 'open':
      return 'bg-green-500';
    case 'closed':
      return 'bg-red-500';
    case 'judging':
      return 'bg-yellow-500';
    case 'completed':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (status: Contest['status']) => {
  switch (status) {
    case 'open':
      return 'Open for Applications';
    case 'closed':
      return 'Applications Closed';
    case 'judging':
      return 'Under Review';
    case 'completed':
      return 'Completed';
    default:
      return 'Draft';
  }
};

export default function ContestCard({ contest }: ContestCardProps) {
  const isOpen = contest.status === 'open';
  const applicationDeadline = new Date(contest.applicationDeadline);
  const endDate = new Date(contest.endDate);
  const isApplicationDeadlinePassed = new Date() > applicationDeadline;

  return (
    <Card className="h-full flex flex-col">
      <div className="relative">
        <Image
          src={contest.image}
          alt={contest.title}
          width={400}
          height={200}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <Badge 
          className={`absolute top-2 right-2 ${getStatusColor(contest.status)} text-white`}
        >
          {getStatusText(contest.status)}
        </Badge>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl line-clamp-2">{contest.title}</CardTitle>
          <Badge variant="outline">{contest.category}</Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {contest.shortDescription}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Trophy className="w-4 h-4" />
          <span className="font-semibold">Prize:</span>
          <span>{contest.prize}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{contest.currentParticipants} / {contest.maxParticipants} participants</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Apply by: {applicationDeadline.toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Ends: {endDate.toLocaleDateString()}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/contests/${contest.id}`}>
              View Details
            </Link>
          </Button>
          
          {isOpen && !isApplicationDeadlinePassed && (
            <Button asChild className="flex-1">
              <Link href={`/contests/${contest.id}/apply`}>
                Apply Now
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 