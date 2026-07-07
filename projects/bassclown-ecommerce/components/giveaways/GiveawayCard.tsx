import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Gift, Users } from 'lucide-react';
import Link from 'next/link';
import { Giveaway } from '@/lib/types';

interface GiveawayCardProps {
  giveaway: Giveaway;
  showEntryButton?: boolean;
  variant?: 'default' | 'compact';
}

export function GiveawayCard({ giveaway, showEntryButton = true, variant = 'default' }: GiveawayCardProps) {
  const isActive = giveaway.status === 'active';
  const isUpcoming = giveaway.status === 'upcoming';
  const isEnded = giveaway.status === 'ended';
  const daysLeft = Math.ceil((giveaway.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const entryPercentage = giveaway.maxEntries && giveaway.maxEntries > 0 
    ? (giveaway.entryCount / giveaway.maxEntries) * 100 
    : 0;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <Gift className="w-16 h-16 text-blue-500" />
      </div>
      
      <CardHeader className={variant === 'compact' ? 'pb-3' : undefined}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={variant === 'compact' ? 'text-lg' : 'text-xl'}>
              {giveaway.title}
            </CardTitle>
            <CardDescription className="mt-2">{giveaway.description}</CardDescription>
          </div>
          <Badge variant={isActive ? "default" : isUpcoming ? "secondary" : "outline"}>
            {isActive ? "Active" : isUpcoming ? "Upcoming" : "Ended"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className={variant === 'compact' ? 'pt-0' : undefined}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Prize Value</span>
            <span className="font-bold text-green-600">{giveaway.prizeValue}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Entries</span>
            <span className="font-medium">
              {giveaway.entryCount} {giveaway.maxEntries ? `/ ${giveaway.maxEntries}` : ''}
            </span>
          </div>
          
          {giveaway.maxEntries && giveaway.maxEntries > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${entryPercentage}%` }}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Ends {giveaway.endDate.toLocaleDateString()}</span>
            </div>
            {isActive && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{daysLeft} days left</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button asChild className="flex-1" variant="outline">
              <Link href={`/giveaways/${giveaway.id}`}>
                View Details
              </Link>
            </Button>
            {showEntryButton && isActive && (
              <Button className="flex-1">
                Enter Now
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 