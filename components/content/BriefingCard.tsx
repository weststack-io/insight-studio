'use client';

import { Briefing } from '@/types';
import { format } from 'date-fns';

interface BriefingCardProps {
  briefing: Briefing;
}

export function BriefingCard({ briefing }: BriefingCardProps) {
  const content = JSON.parse(briefing.content);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">
            {content.title || `${briefing.type} Briefing`}
          </h3>
          <p className="text-sm text-gray-500">
            {format(new Date(briefing.weekStartDate), 'MMMM d, yyyy')}
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-secondary text-white">
          {briefing.type}
        </span>
      </div>

      {content.summary && (
        <p className="text-gray-700 mb-4">{content.summary}</p>
      )}

      {content.sections && content.sections.length > 0 && (
        <div className="space-y-4 mb-4">
          {content.sections.map((section: any, index: number) => (
            <div key={index}>
              <h4 className="font-semibold text-primary mb-2">
                {section.heading}
              </h4>
              <p className="text-gray-600 text-sm">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {content.keyTakeaways && content.keyTakeaways.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-primary mb-2">Key Takeaways</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {content.keyTakeaways.map((takeaway: string, index: number) => (
              <li key={index}>{takeaway}</li>
            ))}
          </ul>
        </div>
      )}

      {content.nextSteps && content.nextSteps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-primary mb-2">Next Steps</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {content.nextSteps.map((step: string, index: number) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

