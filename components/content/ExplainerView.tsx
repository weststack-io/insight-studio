'use client';

import { Explainer } from '@/types';
import { useState } from 'react';

interface ExplainerViewProps {
  explainer: Explainer;
  onGenerate?: (topic: string, language?: string) => void;
}

export function ExplainerView({ explainer, onGenerate }: ExplainerViewProps) {
  const [loading, setLoading] = useState(false);
  const content = JSON.parse(explainer.content);

  const handleRegenerate = async () => {
    if (onGenerate) {
      setLoading(true);
      try {
        await onGenerate(explainer.topic, explainer.language);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-primary">{content.title || explainer.topic}</h2>
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {content.summary && (
        <p className="text-lg text-gray-700 mb-4 italic">{content.summary}</p>
      )}

      <div className="prose max-w-none mb-6">
        <div
          dangerouslySetInnerHTML={{ __html: content.content }}
          className="text-gray-700"
        />
      </div>

      {content.keyPoints && content.keyPoints.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-primary mb-3">Key Points</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            {content.keyPoints.map((point: string, index: number) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {content.relatedTopics && content.relatedTopics.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-primary mb-3">Related Topics</h3>
          <div className="flex flex-wrap gap-2">
            {content.relatedTopics.map((topic: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-secondary text-white rounded-full cursor-pointer hover:bg-opacity-80"
                onClick={() => onGenerate?.(topic)}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

