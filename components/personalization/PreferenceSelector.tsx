'use client';

import { useState, useEffect } from 'react';
import { InterestLevel } from '@/types';

interface Preference {
  id: string;
  topic: string;
  interestLevel: InterestLevel;
}

interface PreferenceSelectorProps {
  onPreferencesChange?: (preferences: Preference[]) => void;
}

export function PreferenceSelector({ onPreferencesChange }: PreferenceSelectorProps) {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (onPreferencesChange) {
      onPreferencesChange(preferences);
    }
  }, [preferences, onPreferencesChange]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      const data = await response.json();
      setPreferences(data.preferences || []);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreference = async () => {
    if (!newTopic.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: newTopic,
          interestLevel: 'medium',
        }),
      });

      const data = await response.json();
      if (data.preference) {
        setPreferences([...preferences, data.preference]);
        setNewTopic('');
      }
    } catch (error) {
      console.error('Failed to add preference:', error);
    }
  };

  const handleUpdateInterest = async (topic: string, interestLevel: InterestLevel) => {
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          interestLevel,
        }),
      });

      const data = await response.json();
      if (data.preference) {
        setPreferences(
          preferences.map(p =>
            p.topic === topic ? data.preference : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  };

  const handleRemovePreference = async (topic: string) => {
    try {
      await fetch(`/api/preferences?topic=${encodeURIComponent(topic)}`, {
        method: 'DELETE',
      });

      setPreferences(preferences.filter(p => p.topic !== topic));
    } catch (error) {
      console.error('Failed to remove preference:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading preferences...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-primary mb-4">Topic Preferences</h3>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPreference()}
            placeholder="Add a topic of interest"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAddPreference}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {preferences.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No preferences set. Add topics you're interested in to get personalized content.
        </p>
      ) : (
        <div className="space-y-2">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium">{pref.topic}</span>
              <div className="flex items-center gap-2">
                <select
                  value={pref.interestLevel}
                  onChange={(e) =>
                    handleUpdateInterest(pref.topic, e.target.value as InterestLevel)
                  }
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  onClick={() => handleRemovePreference(pref.topic)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

