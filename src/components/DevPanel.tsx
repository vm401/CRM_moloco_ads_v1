import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DevPanelProps {
  onThemeChange?: (theme: string) => void;
  onLayoutChange?: (layout: string) => void;
  onColorSchemeChange?: (colors: any) => void;
}

const DevPanel = ({ onThemeChange, onLayoutChange, onColorSchemeChange }: DevPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');

  const colorSchemes = {
    neon: {
      primary: '#00ff88',
      secondary: '#ff0088',
      background: '#0a0a0a',
      accent: '#8800ff'
    },
    ocean: {
      primary: '#0088ff',
      secondary: '#00ffff',
      background: '#001122',
      accent: '#0044aa'
    },
    sunset: {
      primary: '#ff8800',
      secondary: '#ff4400',
      background: '#220011',
      accent: '#aa4400'
    },
    layerzero: {
      primary: '#4f46e5',
      secondary: '#7c3aed',
      background: '#ffffff',
      accent: '#06b6d4'
    }
  };

  const layouts = ['compact', 'spacious', 'grid', 'cards'];
  const themes = ['dark', 'light', 'auto'];

  const applyColorScheme = (scheme: any) => {
    const root = document.documentElement;
    Object.entries(scheme).forEach(([key, value]) => {
      root.style.setProperty(`--dev-${key}`, value as string);
    });
    onColorSchemeChange?.(scheme);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        >
          🎨 Dev Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-black/90 backdrop-blur border-purple-500/20 text-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🎨 Frontend Dev Panel</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/10"
            >
              ✕
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            {['colors', 'layout', 'components', 'stats'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  activeTab === tab 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {activeTab === 'colors' && (
            <div>
              <h3 className="font-medium mb-3">Color Schemes</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(colorSchemes).map(([name, scheme]) => (
                  <button
                    key={name}
                    onClick={() => applyColorScheme(scheme)}
                    className="p-2 rounded border border-white/20 hover:border-white/40 transition-colors"
                  >
                    <div className="flex gap-1 mb-1">
                      {Object.values(scheme).slice(0, 4).map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="text-xs capitalize">{name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div>
              <h3 className="font-medium mb-3">Layout Options</h3>
              <div className="space-y-2">
                {layouts.map((layout) => (
                  <Button
                    key={layout}
                    variant="outline"
                    size="sm"
                    onClick={() => onLayoutChange?.(layout)}
                    className="w-full justify-start capitalize bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    {layout} Layout
                  </Button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div>
              <h3 className="font-medium mb-3">Component Tweaks</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-300">Border Radius</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    defaultValue="8"
                    className="w-full mt-1"
                    onChange={(e) => {
                      document.documentElement.style.setProperty('--radius', `${e.target.value}px`);
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-300">Animation Speed</label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    defaultValue="1"
                    className="w-full mt-1"
                    onChange={(e) => {
                      document.documentElement.style.setProperty('--animation-duration', `${e.target.value}s`);
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300">Blur Effect</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    defaultValue="10"
                    className="w-full mt-1"
                    onChange={(e) => {
                      document.documentElement.style.setProperty('--blur-amount', `${e.target.value}px`);
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300">Card Shadow</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    defaultValue="10"
                    className="w-full mt-1"
                    onChange={(e) => {
                      document.documentElement.style.setProperty('--card-shadow', `0 ${e.target.value}px ${e.target.value * 2}px rgba(0,0,0,0.1)`);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Element Highlight</label>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        document.querySelectorAll('.lz-card').forEach(el => {
                          (el as HTMLElement).style.outline = '2px solid #00ff88';
                        });
                      }}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      Cards
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        document.querySelectorAll('table').forEach(el => {
                          (el as HTMLElement).style.outline = '2px solid #ff0088';
                        });
                      }}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      Tables
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        document.querySelectorAll('button').forEach(el => {
                          (el as HTMLElement).style.outline = '2px solid #8800ff';
                        });
                      }}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      Buttons
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        document.querySelectorAll('*').forEach(el => {
                          (el as HTMLElement).style.outline = '';
                        });
                      }}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Reset to defaults
                    document.documentElement.style.setProperty('--radius', '8px');
                    document.documentElement.style.setProperty('--animation-duration', '1s');
                    document.documentElement.style.setProperty('--blur-amount', '10px');
                    document.documentElement.style.setProperty('--card-shadow', '0 10px 20px rgba(0,0,0,0.1)');
                    document.querySelectorAll('*').forEach(el => {
                      (el as HTMLElement).style.outline = '';
                    });
                  }}
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  Reset All
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 className="font-medium mb-3">Live Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">DOM Elements:</span>
                  <span>{document.querySelectorAll('*').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Tables:</span>
                  <span>{document.querySelectorAll('table').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Cards:</span>
                  <span>{document.querySelectorAll('.lz-card').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Buttons:</span>
                  <span>{document.querySelectorAll('button').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Viewport:</span>
                  <span>{window.innerWidth}x{window.innerHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">User Agent:</span>
                  <span className="truncate max-w-[120px]" title={navigator.userAgent}>
                    {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Frontend Debug Info:', {
                      elements: document.querySelectorAll('*').length,
                      tables: document.querySelectorAll('table').length,
                      cards: document.querySelectorAll('.lz-card').length,
                      buttons: document.querySelectorAll('button').length,
                      viewport: `${window.innerWidth}x${window.innerHeight}`,
                      userAgent: navigator.userAgent,
                      currentURL: window.location.href,
                      timestamp: new Date().toISOString()
                    });
                    alert('Debug info logged to console!');
                  }}
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  📋 Export Debug Info
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DevPanel;