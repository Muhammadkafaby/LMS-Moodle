'use client'

import { useQuery } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import { MoodleCourse } from '@/lib/moodleAPI'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { BookOpen, Calendar, Star } from 'lucide-react'
import { clsx } from 'clsx'

interface CourseListProps {
  onCourseSelect: (courseId: number) => void
  selectedCourseId: number | null
}

export default function CourseList({ onCourseSelect, selectedCourseId }: CourseListProps) {
  const { moodleAPI, user } = useAuth()

  const {
    data: courses,
    isLoading,
    error,
  } = useQuery<MoodleCourse[]>(
    ['courses', user?.id],
    () => moodleAPI!.getUserCourses(user?.id),
    {
      enabled: !!moodleAPI && !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <span className="text-red-500 dark:text-red-400">Failed to load courses. Please try again.</span>
      </div>
    )
  }
  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300">No courses found.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Make sure you are enrolled in courses on your Moodle site.
        </p>
      </div>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Courses ({courses.length})
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className={clsx(
              'card cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
              selectedCourseId === course.id && 'ring-2 ring-primary-500 bg-primary-50'
            )}
            onClick={() => onCourseSelect(course.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                  {course.fullname}
                </h3>
                <p className="text-xs text-gray-600">
                  {course.shortname}
                </p>
              </div>
              {course.isfavourite && (
                <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0 ml-2" />
              )}
            </div>

            {course.summary && (
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {course.summary.replace(/<[^>]*>/g, '')}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center text-xs text-gray-500">
                <BookOpen className="w-3 h-3 mr-1" />
                <span>Format: {course.format}</span>
              </div>

              {course.lastaccess && (
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Last access: {formatDate(course.lastaccess)}</span>
                </div>
              )}

              {course.progress !== undefined && (
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <span>{course.progress}%</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Category: {course.category}</span>
                {course.enablecompletion && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Completion tracking
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCourseId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Course Selected</h3>
              <p className="text-sm text-blue-700">
                You can now search materials or upload assignments for this course.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}