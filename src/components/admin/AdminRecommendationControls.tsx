import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Save, Check, RotateCcw, BarChart3, Sparkles, Shield, Compass } from 'lucide-react';
import { api } from '../../services/api';
import { AdminRecommendationSettings } from '../../types';

export const AdminRecommendationControls: React.FC = () => {
  const [settings, setSettings] = useState<AdminRecommendationSettings | null>(null);
  const [analytics, setAnalytics] = useState<{
    totalProfiles: number;
    totalEvents: number;
    popularGenres: { genre: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminRecommendationSettings();
      setSettings(res.settings);
      setAnalytics(res.analytics);
    } catch (err) {
      console.error('Failed to load recommendation settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleWeightChange = (key: keyof AdminRecommendationSettings['weights'], val: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      weights: {
        ...settings.weights,
        [key]: val,
      },
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.updateAdminRecommendationSettings(settings);
      setSettings(res.settings);
      setSuccessMsg('Algorithm weights updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update recommendation weights:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      weights: {
        genreMatch: 0.25,
        themeMatch: 0.15,
        languageMatch: 0.10,
        storyTypeMatch: 0.10,
        behavioralSimilarity: 0.15,
        authorAffinity: 0.10,
        communityAffinity: 0.05,
        contentQuality: 0.05,
        freshness: 0.05,
      },
      explorationRate: 0.15,
      trendingThreshold: 1000,
      qualityRatingThreshold: 4.2,
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
        Loading recommendation algorithm weights...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
        <p className="text-xs text-zinc-400">Failed to load recommendation algorithm controls.</p>
      </div>
    );
  }

  const weightSum = (Object.values(settings.weights) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Algorithm Engine</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active v2.4
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Recommendation Weights & Exploration</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure how story scoring distributes weights between explicit taste, behavioral signals, and discovery diversity.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 flex items-center space-x-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center space-x-1.5 hover:opacity-95 transition"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Weights</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Active Interest Profiles</span>
          <div className="text-2xl font-bold text-white">{analytics?.totalProfiles || 0}</div>
          <span className="text-[11px] text-zinc-500">Users with personalized Story DNA</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Behavior Events Logged</span>
          <div className="text-2xl font-bold text-amber-400">{analytics?.totalEvents || 0}</div>
          <span className="text-[11px] text-zinc-500">Reads, likes, bookmarks & reviews</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Weight Normalization</span>
          <div className={`text-2xl font-bold ${Math.abs(weightSum - 1.0) < 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {(weightSum * 100).toFixed(0)}%
          </div>
          <span className="text-[11px] text-zinc-500">Combined scoring factor distribution</span>
        </div>
      </div>

      {/* Weight Tuning Sliders */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Scoring Dimension Weights (0.00 – 1.00)</h3>
          <span className="text-xs text-zinc-400">Sum of factors: {(weightSum * 100).toFixed(1)}%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Genre Match */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Genre Affinity Match</span>
              <span className="text-amber-400 font-bold">{(settings.weights.genreMatch * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={settings.weights.genreMatch}
              onChange={(e) => handleWeightChange('genreMatch', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Match against onboarding & reading history genres</span>
          </div>

          {/* Theme Match */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Theme & Trope Match</span>
              <span className="text-amber-400 font-bold">{(settings.weights.themeMatch * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              value={settings.weights.themeMatch}
              onChange={(e) => handleWeightChange('themeMatch', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Story tags and thematic elements</span>
          </div>

          {/* Story Type Match */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Story Type & Medium</span>
              <span className="text-amber-400 font-bold">{(settings.weights.storyTypeMatch * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={settings.weights.storyTypeMatch}
              onChange={(e) => handleWeightChange('storyTypeMatch', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Light Novel vs Serialized Novel vs Short Story</span>
          </div>

          {/* Behavioral Similarity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Behavioral Similarity</span>
              <span className="text-amber-400 font-bold">{(settings.weights.behavioralSimilarity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              value={settings.weights.behavioralSimilarity}
              onChange={(e) => handleWeightChange('behavioralSimilarity', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Dynamic learning from bookmarks, comments, likes</span>
          </div>

          {/* Author Affinity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Author Affinity</span>
              <span className="text-amber-400 font-bold">{(settings.weights.authorAffinity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={settings.weights.authorAffinity}
              onChange={(e) => handleWeightChange('authorAffinity', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Boost for followed or frequently read creators</span>
          </div>

          {/* Language Match */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Language Alignment</span>
              <span className="text-amber-400 font-bold">{(settings.weights.languageMatch * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={settings.weights.languageMatch}
              onChange={(e) => handleWeightChange('languageMatch', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Preferred reading languages</span>
          </div>

          {/* Freshness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Freshness / Recent Releases</span>
              <span className="text-amber-400 font-bold">{(settings.weights.freshness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={settings.weights.freshness}
              onChange={(e) => handleWeightChange('freshness', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Prioritizes recently updated chapters</span>
          </div>

          {/* Content Quality */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">Content Quality & Rating</span>
              <span className="text-amber-400 font-bold">{(settings.weights.contentQuality * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={settings.weights.contentQuality}
              onChange={(e) => handleWeightChange('contentQuality', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 block">Editorial checks and reader star ratings</span>
          </div>
        </div>
      </div>

      {/* Filter Bubble Prevention & Exploration Rate */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Filter Bubble Prevention (Serendipity Factor)</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Controls the percentage of stories in the Home and Discover feeds allocated to outside-of-profile exploratory genres and emerging debut authors.
        </p>

        <div className="space-y-1.5 max-w-md">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-zinc-200">Exploration Rate</span>
            <span className="text-purple-400 font-bold">{(settings.explorationRate * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.4"
            step="0.01"
            value={settings.explorationRate}
            onChange={(e) => setSettings({ ...settings, explorationRate: parseFloat(e.target.value) })}
            className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>5% (Strict Taste Match)</span>
            <span>20% (Recommended Balance)</span>
            <span>40% (High Serendipity)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
