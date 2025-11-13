'use client';

import { Lesson } from '@/types';

interface LessonViewProps {
  lesson: Lesson;
}

export function LessonView({ lesson }: LessonViewProps) {
  const content = JSON.parse(lesson.content);

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">
          {content.title || lesson.topic}
        </h3>
        <div className="flex flex-wrap gap-2">
          {lesson.generation && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {lesson.generation}
            </span>
          )}
          {lesson.sophisticationLevel && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {lesson.sophisticationLevel}
            </span>
          )}
          {content.estimatedReadTime && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {content.estimatedReadTime}
            </span>
          )}
        </div>
      </div>

      <div 
        className="mb-6 text-gray-700 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_h3]:mt-4 [&_p]:mb-4 [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:space-y-2 [&_li]:text-gray-700"
        dangerouslySetInnerHTML={{ __html: content.content }}
      />

      {content.keyTakeaways && content.keyTakeaways.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Key Takeaways
          </h4>
          <ul className="space-y-2">
            {content.keyTakeaways.map((takeaway: string, index: number) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <span className="text-primary mt-1.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="flex-1">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

