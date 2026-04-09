import { useState, useMemo } from 'react';
import { 
  Youtube, 
  Instagram, 
  TrendingUp, 
  Target, 
  Calendar, 
  Users,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, addDays, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Platform, Milestone, ProjectionPoint } from './types';

const PLATFORMS: { id: Platform; name: string; icon: any; color: string }[] = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
    </svg>
  ), color: '#000000' },
];

const DEFAULT_MILESTONES: number[] = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

export default function App() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  
  // Maintain separate state for each platform
  const [platformData, setPlatformData] = useState<Record<Platform, { currentSubs: string; growth7Days: string; acceleration: number[] }>>({
    youtube: { currentSubs: '1000', growth7Days: '50', acceleration: [0] },
    instagram: { currentSubs: '29800', growth7Days: '350', acceleration: [0] },
    tiktok: { currentSubs: '5000', growth7Days: '200', acceleration: [0] },
  });

  const activeData = platformData[platform];

  const updateActiveData = (updates: Partial<{ currentSubs: string; growth7Days: string; acceleration: number[] }>) => {
    setPlatformData(prev => ({
      ...prev,
      [platform]: { ...prev[platform], ...updates }
    }));
  };

  const stats = useMemo(() => {
    const current = parseInt(activeData.currentSubs) || 0;
    const growth = parseInt(activeData.growth7Days) || 0;
    const dailyGrowth = growth / 7;
    const monthlyAccel = activeData.acceleration[0] / 100;
    
    return { current, growth, dailyGrowth, monthlyAccel };
  }, [activeData]);

  const milestones = useMemo(() => {
    if (stats.dailyGrowth <= 0) return [];

    // For milestones, we'll use a simplified iterative calculation if acceleration is present
    const results = [];
    const targets = DEFAULT_MILESTONES.filter(m => m > stats.current).slice(0, 4);
    
    for (const target of targets) {
      let current = stats.current;
      let days = 0;
      let currentDailyGrowth = stats.dailyGrowth;
      
      // Limit to 10 years to prevent infinite loops
      while (current < target && days < 3650) {
        current += currentDailyGrowth;
        days++;
        // Apply acceleration monthly (approx every 30 days)
        if (days % 30 === 0) {
          currentDailyGrowth *= (1 + stats.monthlyAccel);
        }
      }

      const date = addDays(new Date(), days);
      results.push({
        target,
        daysToReach: days,
        date,
        label: target >= 1000000 ? `${target / 1000000}M` : `${target / 1000}K`
      });
    }

    return results;
  }, [stats]);

  const chartData = useMemo(() => {
    if (stats.dailyGrowth <= 0) return [];

    const data: ProjectionPoint[] = [];
    const today = new Date();
    
    const maxDays = milestones.length > 0 
      ? Math.min(milestones[milestones.length - 1].daysToReach + 30, 1825) // Max 5 years
      : 365;

    let currentSubsValue = stats.current;
    let currentDailyGrowth = stats.dailyGrowth;
    const step = Math.max(1, Math.floor(maxDays / 20));

    for (let i = 0; i <= maxDays; i += step) {
      const date = addDays(today, i);
      
      // Calculate subs at this point with acceleration
      // We need to account for the growth change over the interval
      let subsAtPoint = currentSubsValue;
      let tempGrowth = currentDailyGrowth;
      for(let d = 0; d < step; d++) {
        subsAtPoint += tempGrowth;
        if ((i + d) % 30 === 0 && (i + d) > 0) {
          tempGrowth *= (1 + stats.monthlyAccel);
        }
      }
      
      // Update baseline for next iteration
      currentSubsValue = subsAtPoint;
      currentDailyGrowth = tempGrowth;

      data.push({
        date: format(date, 'MMM yyyy'),
        subscribers: Math.floor(subsAtPoint)
      });
    }

    return data;
  }, [stats, milestones]);

  const activePlatform = PLATFORMS.find(p => p.id === platform)!;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">SocialGrowth Pro</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><Info className="w-4 h-4" /> Linear Projection</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-lg">Growth Parameters</CardTitle>
                <CardDescription>Configure your current stats</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label>Platform</Label>
                  <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)} className="w-full">
                    <TabsList className="grid grid-cols-3 w-full h-12 bg-zinc-100 p-1">
                      {PLATFORMS.map((p) => (
                        <TabsTrigger 
                          key={p.id} 
                          value={p.id}
                          className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                        >
                          <p.icon className="w-4 h-4 mr-2" style={{ color: platform === p.id ? p.color : undefined }} />
                          <span className="hidden sm:inline">{p.name}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-subs" className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-400" />
                      Current Subscribers
                    </Label>
                    <div className="relative">
                      <Input 
                        id="current-subs"
                        type="number" 
                        value={activeData.currentSubs} 
                        onChange={(e) => updateActiveData({ currentSubs: e.target.value })}
                        className="pl-4 h-11 border-zinc-200 focus:ring-zinc-900"
                        placeholder="e.g. 29800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="growth-7" className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-zinc-400" />
                      Growth (Last 7 Days)
                    </Label>
                    <div className="relative">
                      <Input 
                        id="growth-7"
                        type="number" 
                        value={activeData.growth7Days} 
                        onChange={(e) => updateActiveData({ growth7Days: e.target.value })}
                        className="pl-4 h-11 border-zinc-200 focus:ring-zinc-900"
                        placeholder="e.g. 350"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-zinc-400" />
                        Monthly Acceleration
                      </Label>
                      <Badge variant="outline" className="font-mono text-[10px]">{activeData.acceleration[0]}%</Badge>
                    </div>
                    <Slider 
                      value={activeData.acceleration} 
                      onValueChange={(v) => updateActiveData({ acceleration: Array.isArray(v) ? [...v] : [v] })} 
                      max={20} 
                      step={0.5}
                      className="py-2"
                    />
                    <p className="text-[10px] text-zinc-400 italic">
                      Simulates compounding growth (e.g. virality or scaling).
                    </p>
                  </div>
                </div>

                <Separator className="bg-zinc-100" />

                <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Daily Growth Rate</span>
                    <span className="font-medium text-zinc-900">+{stats.dailyGrowth.toFixed(1)} / day</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Monthly Projection</span>
                    <span className="font-medium text-zinc-900">+{Math.floor(stats.dailyGrowth * 30.4).toLocaleString()} / mo</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Yearly Projection</span>
                    <span className="font-medium text-zinc-900">+{Math.floor(stats.dailyGrowth * 365).toLocaleString()} / yr</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-zinc-400" />
                  Growth Strategy
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  At your current rate, you'll reach your next major milestone in 
                  <span className="text-white font-medium"> {milestones[0]?.daysToReach || '...'} days</span>. 
                  Consistency is key for {activePlatform.name} algorithms.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <activePlatform.icon className="w-32 h-32" />
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Milestones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {milestones.length > 0 ? (
                  milestones.map((m, idx) => (
                    <motion.div
                      key={m.target}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm h-full">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Milestone</p>
                              <h3 className="text-3xl font-bold tracking-tight">{m.label}</h3>
                            </div>
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none px-3 py-1">
                              {m.target.toLocaleString()}
                            </Badge>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-600">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-zinc-500">Estimated Date</p>
                                <p className="font-semibold text-zinc-900">{format(m.date, 'MMMM do, yyyy')}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-600">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-zinc-500">Time Remaining</p>
                                <p className="font-semibold text-zinc-900">
                                  {m.daysToReach > 365 
                                    ? `${(m.daysToReach / 365).toFixed(1)} years` 
                                    : `${m.daysToReach} days`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                    <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500">Enter your growth stats to see projections</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Chart Section */}
            <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Growth Projection</CardTitle>
                  <CardDescription>Visualizing your journey to {milestones[milestones.length-1]?.label || 'milestones'}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activePlatform.color }} />
                  <span className="text-xs font-medium text-zinc-500">{activePlatform.name}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={activePlatform.color} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={activePlatform.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#888' }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#888' }}
                          tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '12px', 
                            border: '1px solid #e5e5e5',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value: number) => [value.toLocaleString(), 'Subscribers']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="subscribers" 
                          stroke={activePlatform.color} 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorSubs)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-400 italic">
                      Insufficient data for chart
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">
            © 2026 SocialGrowth Pro. Projections are estimates based on current trends.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest">Terms</a>
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest">Feedback</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
