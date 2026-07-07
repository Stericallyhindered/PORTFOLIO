'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User } from 'lucide-react';

export const ProfileForm = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'member',
    bio: 'Passionate angler and video creator focused on sharing the joy of fishing with others.',
    location: 'Phoenix, Arizona',
    website: 'https://bassclown.co',
    socialMedia: {
      youtube: '@bassclownco',
      instagram: '@bassclownco',
      twitter: '@bassclownco'
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: formData.name,
      email: formData.email,
      role: formData.role as 'bass-admin' | 'member' | 'brand-admin' | 'guest'
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'bass-admin': return 'Bass Admin';
      case 'brand-admin': return 'Brand Admin';
      case 'member': return 'Member';
      case 'guest': return 'Guest';
      default: return role;
    }
  };

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Profile Information</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-red-600 text-white text-xl">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">{user?.name}</h3>
            <p className="text-sm text-gray-400">{getRoleDisplayName(user?.role || '')}</p>
            <p className="text-sm text-gray-400">Member since {user?.joinDate}</p>
          </div>
          {isEditing && (
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Camera size={16} className="mr-2" />
              Change Photo
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role" className="text-gray-300">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-600">
                  <SelectItem value="member" className="text-white hover:bg-gray-700">Member</SelectItem>
                  <SelectItem value="brand-admin" className="text-white hover:bg-gray-700">Brand Admin</SelectItem>
                  <SelectItem value="bass-admin" className="text-white hover:bg-gray-700">Bass Admin</SelectItem>
                  <SelectItem value="guest" className="text-white hover:bg-gray-700">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location" className="text-gray-300">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
                className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website" className="text-gray-300">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={!isEditing}
              className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-gray-300">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={!isEditing}
              rows={4}
              className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
            />
          </div>

          {/* Social Media */}
          <div className="space-y-2">
            <Label className="text-gray-300">Social Media</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="youtube" className="text-sm text-gray-400">YouTube</Label>
                <Input
                  id="youtube"
                  value={formData.socialMedia.youtube}
                  onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="instagram" className="text-sm text-gray-400">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialMedia.instagram}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
                />
              </div>
              <div>
                <Label htmlFor="twitter" className="text-sm text-gray-400">Twitter</Label>
                <Input
                  id="twitter"
                  value={formData.socialMedia.twitter}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  disabled={!isEditing}
                  className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="pt-4">
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}; 