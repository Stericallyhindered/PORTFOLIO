'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Shield, Ban, Mail, Phone, Calendar, Trophy, Award, Gift } from 'lucide-react';
import Link from 'next/link';
import { RoleManagementDialog } from '@/components/admin/RoleManagementDialog';
import { useParams, useRouter } from 'next/navigation';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch user data
    fetch(`/api/admin/users/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRoleDialogOpen(true)}
          >
            <Shield className="h-4 w-4 mr-2" />
            Manage Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : user.email[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-lg">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <Badge variant={getStatusColor(user.status)} className="mt-1">
                  {user.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                {user.phone}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Joined {user.joinDate}
              </div>
              <div className="flex items-center text-sm">
                <Badge variant="outline">
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">{user.bio}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contests</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.stats.contestsEntered}</div>
                <p className="text-xs text-muted-foreground">Entered</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wins</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.stats.contestsWon}</div>
                <p className="text-xs text-muted-foreground">Won</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.stats.pointsEarned}</div>
                <p className="text-xs text-muted-foreground">Earned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User{"'"}s latest actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.activity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'contest_win' ? 'bg-green-500' :
                      activity.type === 'contest_entry' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.date}</p>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contest Participation</CardTitle>
              <CardDescription>All contests this user has entered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.contests.map((contest: any) => (
                  <div key={contest.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{contest.title}</p>
                      <p className="text-sm text-gray-600">Entered: {contest.entryDate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={contest.status === 'active' ? 'default' : 'secondary'}>
                        {contest.status}
                      </Badge>
                      <Badge variant={contest.submissionStatus === 'winner' ? 'default' : 'outline'}>
                        {contest.submissionStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>User{"'"}s account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive email updates about contests and activities</p>
                  </div>
                  <Badge variant={user.preferences.notifications ? 'default' : 'secondary'}>
                    {user.preferences.notifications ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Newsletter</p>
                    <p className="text-sm text-gray-600">Subscribe to newsletter and updates</p>
                  </div>
                  <Badge variant={user.preferences.newsletter ? 'default' : 'secondary'}>
                    {user.preferences.newsletter ? 'Subscribed' : 'Unsubscribed'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Public Profile</p>
                    <p className="text-sm text-gray-600">Make profile visible to other users</p>
                  </div>
                  <Badge variant={user.preferences.publicProfile ? 'default' : 'secondary'}>
                    {user.preferences.publicProfile ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RoleManagementDialog
        userId={user.id}
        userName={user.name || user.email}
        currentRole={user.role}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        onRoleUpdated={() => {
          // Refresh user data
          fetch(`/api/admin/users/${id}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setUser(data.data);
              }
            });
        }}
      />
    </div>
  );
} 