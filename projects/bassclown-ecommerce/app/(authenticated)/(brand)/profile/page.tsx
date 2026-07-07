'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Camera, 
  Save, 
  Edit, 
  Plus, 
  Trash2,
  Star,
  Users,
  Trophy,
  BarChart3,
  Settings,
  Loader2
} from 'lucide-react';

interface BrandData {
  name: string;
  logo: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  companySize: string;
  establishedYear: string;
  socialMedia: {
    instagram: string;
    youtube: string;
    facebook: string;
    twitter: string;
  };
  specialties: string[];
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    contestUpdates: boolean;
    marketingEmails: boolean;
    publicProfile: boolean;
  };
}

const defaultBrandData: BrandData = {
  name: '',
  logo: '/images/bass-clown-co-logo-cream.svg',
  description: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  industry: 'Media & Entertainment',
  companySize: '1-10 employees',
  establishedYear: '',
  socialMedia: { instagram: '', youtube: '', facebook: '', twitter: '' },
  specialties: [],
  preferences: {
    emailNotifications: true,
    smsNotifications: false,
    contestUpdates: true,
    marketingEmails: false,
    publicProfile: true
  }
};

export default function BrandProfilePage() {
  const [brandData, setBrandData] = useState<BrandData>(defaultBrandData);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const profile = result.data;
          setBrandData(prev => ({
            ...prev,
            name: profile.name || profile.companyName || '',
            email: profile.email || '',
            phone: profile.phone || '',
            website: profile.website || '',
            description: profile.bio || profile.description || '',
            address: profile.address || '',
            industry: profile.industry || 'Media & Entertainment',
            companySize: profile.companySize || '1-10 employees',
            establishedYear: profile.establishedYear || '',
            socialMedia: profile.socialMedia || prev.socialMedia,
            specialties: profile.specialties || prev.specialties,
            preferences: profile.preferences || prev.preferences,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setBrandData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setBrandData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handlePreferencesChange = (preference: string, value: boolean) => {
    setBrandData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: brandData.name,
          bio: brandData.description,
          phone: brandData.phone,
          website: brandData.website,
          socialMedia: brandData.socialMedia,
          specialties: brandData.specialties,
          preferences: brandData.preferences,
        })
      });

      if (response.ok) {
        setIsEditing(false);
        alert('Profile saved successfully!');
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    const newSpecialty = prompt('Enter new specialty:');
    if (newSpecialty) {
      setBrandData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty]
      }));
    }
  };

  const removeSpecialty = (index: number) => {
    setBrandData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brand Profile</h1>
            <p className="text-gray-600 mt-2">Manage your brand information and preferences</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Save Changes</>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={brandData.logo} alt={brandData.name} />
                  <AvatarFallback>{brandData.name.charAt(0) || 'B'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{brandData.name || 'Your Brand'}</h2>
                <p className="text-gray-600 mt-1">{brandData.industry}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic information about your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      value={brandData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select 
                      value={brandData.industry} 
                      onValueChange={(value) => handleInputChange('industry', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Outdoor Recreation">Outdoor Recreation</SelectItem>
                        <SelectItem value="Sports & Fitness">Sports & Fitness</SelectItem>
                        <SelectItem value="Marketing & Advertising">Marketing & Advertising</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select 
                      value={brandData.companySize} 
                      onValueChange={(value) => handleInputChange('companySize', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                        <SelectItem value="10-50 employees">10-50 employees</SelectItem>
                        <SelectItem value="50-200 employees">50-200 employees</SelectItem>
                        <SelectItem value="200+ employees">200+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="establishedYear">Established Year</Label>
                    <Input
                      id="establishedYear"
                      value={brandData.establishedYear}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    value={brandData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!isEditing}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
                <CardDescription>Your brand&apos;s areas of expertise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {brandData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      {isEditing && (
                        <button
                          onClick={() => removeSpecialty(index)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {brandData.specialties.length === 0 && (
                    <p className="text-sm text-gray-500">No specialties added yet</p>
                  )}
                </div>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={addSpecialty}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Specialty
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How people can reach your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={brandData.email}
                        disabled
                        className="opacity-60"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email is managed through account settings</p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={brandData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <Input
                        id="website"
                        type="url"
                        value={brandData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <Input
                        id="address"
                        value={brandData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Accounts</CardTitle>
                <CardDescription>Your brand&apos;s social media presence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={brandData.socialMedia.instagram}
                      onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                      disabled={!isEditing}
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={brandData.socialMedia.youtube}
                      onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Channel name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={brandData.socialMedia.facebook}
                      onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Page name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={brandData.socialMedia.twitter}
                      onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                      disabled={!isEditing}
                      placeholder="@username"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={brandData.preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferencesChange('emailNotifications', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="contest-updates">Contest Updates</Label>
                      <p className="text-sm text-gray-500">Get notified about contest activity</p>
                    </div>
                    <Switch
                      id="contest-updates"
                      checked={brandData.preferences.contestUpdates}
                      onCheckedChange={(checked) => handlePreferencesChange('contestUpdates', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="public-profile-pref">Public Profile</Label>
                      <p className="text-sm text-gray-500">Make your brand profile visible to the public</p>
                    </div>
                    <Switch
                      id="public-profile-pref"
                      checked={brandData.preferences.publicProfile}
                      onCheckedChange={(checked) => handlePreferencesChange('publicProfile', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
