'use client';

import { Lesson } from '@/types';

interface LessonViewProps {
  lesson: Lesson;
}

export function LessonView({ lesson }: LessonViewProps) {
  const content = JSON.parse(lesson.content);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-primary mb-2">
            {content.title || lesson.topic}
          </h3>
          <div className="flex gap-2 text-sm text-gray-500">
            {lesson.generation && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {lesson.generation}
              </span>
            )}
            {lesson.sophisticationLevel && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {lesson.sophisticationLevel}
              </span>
            )}
            {content.estimatedReadTime && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {content.estimatedReadTime}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="prose max-w-none mb-4">
        <div
          dangerouslySetInnerHTML={{ __html: content.content }}
          className="text-gray-700"
        />
      </div>

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
    </div>
  );
}

