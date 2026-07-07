'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Building, Trophy, Gift } from 'lucide-react';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  contestsSponsored: number;
  giveawaysSponsored: number;
  totalSponsored: number;
  status: string;
}

interface BrandsData {
  brands: Brand[];
  total: number;
}

export default function AdminBrandsPage() {
  const [data, setData] = useState<BrandsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/brands', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands =
    data?.brands.filter(
      (b) =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600 mt-1">
            Brands derived from contest sponsors and giveaway sponsors
          </p>
        </div>
        <Link href="/admin/contests/create">
          <span className="text-sm text-gray-500">
            Add brands by creating contests with brand names
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.total}</div>
                <p className="text-xs text-muted-foreground">From contests and giveaways</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contest Sponsors</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.brands.reduce((s, b) => s + b.contestsSponsored, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total contest sponsorships</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giveaway Sponsors</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.brands.reduce((s, b) => s + b.giveawaysSponsored, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total giveaway sponsorships</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Brand Partners</CardTitle>
              <CardDescription>
                Brands who have sponsored contests or giveaways. Add new brands by setting brand
                name on contests or sponsor on giveaways.
              </CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search brands..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBrands.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No brands found. Create contests with brand names or giveaways with sponsors to
                  see them here.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Contests Sponsored</TableHead>
                      <TableHead>Giveaways Sponsored</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell>{brand.contestsSponsored}</TableCell>
                        <TableCell>{brand.giveawaysSponsored}</TableCell>
                        <TableCell>{brand.totalSponsored}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{brand.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href="/admin/contests">
                            <span className="text-sm text-blue-600 hover:underline">
                              View Contests
                            </span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">Failed to load brands</div>
      )}
    </div>
  );
}
