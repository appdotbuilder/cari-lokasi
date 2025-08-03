
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  Category, 
  LocationWithCategory, 
  CreateCategoryInput, 
  CreateLocationInput,
  GetNearbyLocationsInput 
} from '../../server/src/schema';

function App() {
  // Main data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationWithCategory[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationWithCategory[]>([]);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(10);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    slug: ''
  });
  
  const [locationForm, setLocationForm] = useState<CreateLocationInput>({
    name: '',
    description: null,
    address: '',
    latitude: 0,
    longitude: 0,
    category_id: 0,
    phone: null,
    website: null,
    rating: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  // Load initial data
  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadAllLocations = useCallback(async () => {
    try {
      const result = await trpc.getLocations.query();
      setLocations(result);
      setFilteredLocations(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadAllLocations();
  }, [loadCategories, loadAllLocations]);

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });
      
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setUserLocation(coords);
      
      // Get nearby locations
      const nearbyInput: GetNearbyLocationsInput = {
        latitude: coords.lat,
        longitude: coords.lng,
        radius: searchRadius,
        category_slug: selectedCategory !== 'all' ? selectedCategory : undefined
      };
      
      const nearbyLocations = await trpc.getNearbyLocations.query(nearbyInput);
      setFilteredLocations(nearbyLocations);
      
    } catch (error) {
      console.error('Failed to get location:', error);
      alert('Tidak dapat mengakses lokasi. Pastikan Anda memberikan izin lokasi.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Filter locations by category
  const filterByCategory = useCallback(async (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    
    try {
      if (categorySlug === 'all') {
        if (userLocation) {
          const nearbyInput: GetNearbyLocationsInput = {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            radius: searchRadius
          };
          const nearbyLocations = await trpc.getNearbyLocations.query(nearbyInput);
          setFilteredLocations(nearbyLocations);
        } else {
          setFilteredLocations(locations);
        }
      } else {
        if (userLocation) {
          const nearbyInput: GetNearbyLocationsInput = {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            radius: searchRadius,
            category_slug: categorySlug
          };
          const nearbyLocations = await trpc.getNearbyLocations.query(nearbyInput);
          setFilteredLocations(nearbyLocations);
        } else {
          const categoryLocations = await trpc.getLocationsByCategory.query({ category_slug: categorySlug });
          setFilteredLocations(categoryLocations);
        }
      }
    } catch (error) {
      console.error('Failed to filter locations:', error);
    }
  }, [userLocation, searchRadius, locations]);

  // Category management
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newCategory = await trpc.createCategory.mutate(categoryForm);
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setCategoryForm({ name: '', slug: '' });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Location management
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await trpc.createLocation.mutate(locationForm);
      // Refresh locations
      await loadAllLocations();
      setLocationForm({
        name: '',
        description: null,
        address: '',
        latitude: 0,
        longitude: 0,
        category_id: 0,
        phone: null,
        website: null,
        rating: null
      });
      setLocationDialogOpen(false);
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    try {
      await trpc.deleteLocation.mutate({ id: locationId });
      setLocations((prev: LocationWithCategory[]) => prev.filter(loc => loc.id !== locationId));
      setFilteredLocations((prev: LocationWithCategory[]) => prev.filter(loc => loc.id !== locationId));
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await trpc.deleteCategory.mutate({ id: categoryId });
      setCategories((prev: Category[]) => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Calculate distance for display
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🗺️ Pencari Lokasi</h1>
          <p className="text-gray-600">Temukan lokasi terdekat berdasarkan kategori</p>
        </div>

        <Tabs defaultValue="finder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mx-auto">
            <TabsTrigger value="finder">🔍 Pencari Lokasi</TabsTrigger>
            <TabsTrigger value="admin">⚙️ Kelola Data</TabsTrigger>
          </TabsList>

          <TabsContent value="finder" className="space-y-6">
            {/* Location Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <Button 
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoadingLocation ? '📍 Mencari...' : '📍 Lokasi Saya Sekarang'}
                  </Button>
                  
                  {userLocation && (
                    <div className="text-sm text-gray-600">
                      📍 Lokasi: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="radius">Radius:</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={searchRadius}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setSearchRadius(parseInt(e.target.value) || 10)
                      }
                      className="w-20"
                      min="1"
                      max="100"
                    />
                    <span className="text-sm text-gray-600">km</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => filterByCategory('all')}
                    className="mb-2"
                  >
                    🏪 Semua
                  </Button>
                  {categories.map((category: Category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.slug ? 'default' : 'outline'}
                      onClick={() => filterByCategory(category.slug)}
                      className="mb-2"
                    >
                      {getCategoryIcon(category.slug)} {category.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                📍 Lokasi Ditemukan ({filteredLocations.length})
              </h2>
              
              {filteredLocations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p>Tidak ada lokasi ditemukan</p>
                    <p className="text-sm">Coba ubah kategori atau radius pencarian</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredLocations.map((location: LocationWithCategory) => (
                    <Card key={location.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{location.name}</CardTitle>
                          <Badge variant="secondary">
                            {getCategoryIcon(location.category.slug)} {location.category.name}
                          </Badge>
                        </div>
                        {userLocation && (
                          <div className="text-sm text-blue-600">
                            📏 {calculateDistance(
                              userLocation.lat, 
                              userLocation.lng, 
                              location.latitude, 
                              location.longitude
                            ).toFixed(2)} km
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        {location.description && (
                          <p className="text-gray-600 mb-2">{location.description}</p>
                        )}
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{location.address}</span>
                          </div>
                          {location.phone && (
                            <div className="flex items-center gap-2">
                              <span>📞</span>
                              <span>{location.phone}</span>
                            </div>
                          )}
                          {location.website && (
                            <div className="flex items-center gap-2">
                              <span>🌐</span>
                              <a 
                                href={location.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Website
                              </a>
                            </div>
                          )}
                          {location.rating && (
                            <div className="flex items-center gap-2">
                              <span>⭐</span>
                              <span>{location.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Management */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>🏷️ Kelola Kategori</CardTitle>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>➕ Tambah Kategori</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tambah Kategori Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                          <div>
                            <Label htmlFor="cat-name">Nama Kategori</Label>
                            <Input
                              id="cat-name"
                              value={categoryForm.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                              }
                              placeholder="Contoh: Kuliner"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cat-slug">Slug</Label>
                            <Input
                              id="cat-slug"
                              value={categoryForm.slug}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, slug: e.target.value }))
                              }
                              placeholder="Contoh: kuliner"
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setDialogOpen(false)}
                            >
                              Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((category: Category) => (
                      <div key={category.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({category.slug})</span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">🗑️</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                              <AlertDialogDescription>
                                Yakin ingin menghapus kategori "{category.name}"? Aksi ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Location Management */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>📍 Kelola Lokasi</CardTitle>
                    <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>➕ Tambah Lokasi</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Tambah Lokasi Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateLocation} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="loc-name">Nama Lokasi</Label>
                              <Input
                                id="loc-name"
                                value={locationForm.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setLocationForm((prev: CreateLocationInput) => ({ ...prev, name: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="loc-category">Kategori</Label>
                              <Select
                                value={locationForm.category_id.toString()}
                                onValueChange={(value: string) =>
                                  setLocationForm((prev: CreateLocationInput) => ({ ...prev, category_id: parseInt(value) }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category: Category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="loc-description">Deskripsi</Label>
                            <Textarea
                              id="loc-description"
                              value={locationForm.description || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setLocationForm((prev: CreateLocationInput) => ({ 
                                  ...prev, 
                                  description: e.target.value || null 
                                }))
                              }
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="loc-address">Alamat</Label>
                            <Input
                              id="loc-address"
                              value={locationForm.address}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setLocationForm((prev: CreateLocationInput) => ({ ...prev, address: e.target.value }))
                              }
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="loc-lat">Latitude</Label>
                              <Input
                                id="loc-lat"
                                type="number"
                                step="any"
                                value={locationForm.latitude}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setLocationForm((prev: CreateLocationInput) => ({ 
                                    ...prev, 
                                    latitude: parseFloat(e.target.value) || 0 
                                  }))
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="loc-lng">Longitude</Label>
                              <Input
                                id="loc-lng"
                                type="number"
                                step="any"
                                value={locationForm.longitude}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setLocationForm((prev: CreateLocationInput) => ({ 
                                    ...prev, 
                                    longitude: parseFloat(e.target.value) || 0 
                                  }))
                                }
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="loc-phone">Telepon</Label>
                              <Input
                                id="loc-phone"
                                value={locationForm.phone || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setLocationForm((prev: CreateLocationInput) => ({ 
                                    ...prev, 
                                    phone: e.target.value || null 
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="loc-website">Website</Label>
                              <Input
                                id="loc-website"
                                type="url"
                                value={locationForm.website || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setLocationForm((prev: CreateLocationInput) => ({ 
                                    ...prev, 
                                    website: e.target.value || null 
                                  }))
                                }
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="loc-rating">Rating (0-5)</Label>
                            <Input
                              id="loc-rating"
                              type="number"
                              min="0"
                              max="5"
                              step="0.1"
                              value={locationForm.rating || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setLocationForm((prev: CreateLocationInput) => ({ 
                                  ...prev, 
                                  rating: parseFloat(e.target.value) || null 
                                }))
                              }
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setLocationDialogOpen(false)}
                            >
                              Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {locations.map((location: LocationWithCategory) => (
                      <div key={location.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-gray-500">
                            {location.category.name} • {location.address}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">🗑️</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Lokasi</AlertDialogTitle>
                              <AlertDialogDescription>
                                Yakin ingin menghapus lokasi "{location.name}"? Aksi ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteLocation(location.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper function for category icons
function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    layanan: '🔧',
    kuliner: '🍽️',
    belanja: '🛍️',
    wisata: '🏖️',
    'all': '🏪'
  };
  return icons[slug] || '📍';
}

export default App;
