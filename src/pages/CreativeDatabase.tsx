import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Upload, 
  Play, 
  Image, 
  FileVideo, 
  Search, 
  Filter,
  Eye,
  Download,
  Trash2
} from "lucide-react";

interface CreativeFile {
  id: string;
  name: string;
  type: 'video' | 'image';
  size: number;
  uploadDate: Date;
  url: string;
  thumbnail?: string;
  matchedCampaigns: string[];
  performance?: {
    spend: number;
    impressions: number;
    clicks: number;
    installs: number;
  };
}

const CreativeDatabase: React.FC = () => {
  const [creatives, setCreatives] = useState<CreativeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image'>('all');
  const [selectedCreative, setSelectedCreative] = useState<CreativeFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Симуляция данных креативов (в реальном проекте будет API)
  useEffect(() => {
    // Симуляция загрузки данных
    const mockCreatives: CreativeFile[] = [
      {
        id: '1',
        name: 'summer_sale_video.mp4',
        type: 'video',
        size: 15728640, // 15MB
        uploadDate: new Date('2024-01-15'),
        url: '/mock/summer_sale_video.mp4',
        thumbnail: '/mock/summer_sale_thumb.jpg',
        matchedCampaigns: ['Summer Sale 2024', 'Mobile Games Promo'],
        performance: {
          spend: 12500,
          impressions: 450000,
          clicks: 8900,
          installs: 1250
        }
      },
      {
        id: '2',
        name: 'app_icon_banner.png',
        type: 'image',
        size: 2048000, // 2MB
        uploadDate: new Date('2024-01-10'),
        url: '/mock/app_icon_banner.png',
        matchedCampaigns: ['App Install Campaign'],
        performance: {
          spend: 8900,
          impressions: 320000,
          clicks: 6400,
          installs: 890
        }
      },
      {
        id: '3',
        name: 'gameplay_showcase.mp4',
        type: 'video',
        size: 22548480, // 22MB
        uploadDate: new Date('2024-01-08'),
        url: '/mock/gameplay_showcase.mp4',
        thumbnail: '/mock/gameplay_thumb.jpg',
        matchedCampaigns: ['Gameplay Showcase', 'New User Acquisition'],
        performance: {
          spend: 18700,
          impressions: 580000,
          clicks: 12400,
          installs: 1890
        }
      }
    ];
    
    setCreatives(mockCreatives);
  }, []);

  const filteredCreatives = creatives
    .filter(creative => {
      const matchesSearch = creative.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           creative.matchedCampaigns.some(campaign => 
                             campaign.toLowerCase().includes(searchQuery.toLowerCase())
                           );
      const matchesType = filterType === 'all' || creative.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return type === 'video' ? (
      <FileVideo className="w-5 h-5 text-blue-500" />
    ) : (
      <Image className="w-5 h-5 text-green-500" />
    );
  };

  const handlePreview = (creative: CreativeFile) => {
    setSelectedCreative(creative);
    setShowPreview(true);
  };

  const handleUpload = () => {
    // В реальном проекте здесь будет логика загрузки файлов
    alert('File upload functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-pink-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Creative Database</h1>
        </div>
        
        <Button onClick={handleUpload} className="revenue-button revenue-button-primary">
          <Upload className="w-4 h-4 mr-2" />
          Upload Creative
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="revenue-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Creatives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {creatives.length}
            </div>
          </CardContent>
        </Card>

        <Card className="revenue-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {creatives.filter(c => c.type === 'video').length}
            </div>
          </CardContent>
        </Card>

        <Card className="revenue-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {creatives.filter(c => c.type === 'image').length}
            </div>
          </CardContent>
        </Card>

        <Card className="revenue-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatFileSize(creatives.reduce((sum, c) => sum + c.size, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="revenue-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search creatives or campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 revenue-input"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="revenue-button"
              >
                All
              </Button>
              <Button
                variant={filterType === 'video' ? 'default' : 'outline'}
                onClick={() => setFilterType('video')}
                className="revenue-button"
              >
                Videos
              </Button>
              <Button
                variant={filterType === 'image' ? 'default' : 'outline'}
                onClick={() => setFilterType('image')}
                className="revenue-button"
              >
                Images
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creative Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCreatives.map((creative) => (
          <Card key={creative.id} className="revenue-card hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* File Header */}
                <div className="flex items-center justify-between">
                  {getFileIcon(creative.type)}
                  <Badge variant={creative.type === 'video' ? 'default' : 'secondary'}>
                    {creative.type.toUpperCase()}
                  </Badge>
                </div>

                {/* File Name */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {creative.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(creative.size)} • {creative.uploadDate.toLocaleDateString()}
                  </p>
                </div>

                {/* Matched Campaigns */}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Matched Campaigns:</p>
                  <div className="flex flex-wrap gap-1">
                    {creative.matchedCampaigns.slice(0, 2).map((campaign, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {campaign.length > 15 ? campaign.substring(0, 15) + '...' : campaign}
                      </Badge>
                    ))}
                    {creative.matchedCampaigns.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{creative.matchedCampaigns.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {creative.performance && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Spend</p>
                      <p className="font-semibold text-sm">${creative.performance.spend.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Installs</p>
                      <p className="font-semibold text-sm text-green-600">{creative.performance.installs.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(creative)}
                    className="revenue-button"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="p-1">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="p-1 text-red-500 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCreatives.length === 0 && (
        <Card className="revenue-card">
          <CardContent className="py-12 text-center">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Creatives Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || filterType !== 'all' 
                ? "No creatives match your search criteria" 
                : "Upload your first creative to get started"
              }
            </p>
            <Button onClick={handleUpload} className="revenue-button revenue-button-primary">
              <Upload className="w-4 h-4 mr-2" />
              Upload Creative
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal - заглушка */}
      {showPreview && selectedCreative && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="revenue-card max-w-2xl w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedCreative.name}</span>
                <Button
                  variant="ghost"
                  onClick={() => setShowPreview(false)}
                  className="p-1"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Preview functionality would be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreativeDatabase;
