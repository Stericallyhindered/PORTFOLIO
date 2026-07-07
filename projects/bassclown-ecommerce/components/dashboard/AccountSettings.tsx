'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { Save, Edit, Loader2, Check } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });

  useEffect(() => {
    // Load current user data
    if (user) {
      setFormData({
        email: user.email || '',
        name: user.name || '',
      });
    }
    // Also fetch from API for most up-to-date data
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFormData({
            email: result.data.email || '',
            name: result.data.name || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
        })
      });

      if (response.ok) {
        setSaved(true);
        setIsEditing(false);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to save account settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Account Information</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (isEditing) {
              handleSubmit(new Event('submit') as any);
            } else {
              setIsEditing(true);
            }
          }}
          disabled={saving}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving</>
          ) : saved ? (
            <><Check className="w-4 h-4 mr-1 text-green-400" />Saved</>
          ) : isEditing ? (
            <><Save className="w-4 h-4 mr-1" />Save</>
          ) : (
            <><Edit className="w-4 h-4 mr-1" />Edit</>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-300">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
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
              disabled
              className="bg-[#1A1A1A] border-gray-600 text-white disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
