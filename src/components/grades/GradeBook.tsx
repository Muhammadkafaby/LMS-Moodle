'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { BarChart3, TrendingUp, Award, Target, Calendar } from 'lucide-react'

interface Grade {
  id: number
  itemname: string
  categoryid: number
  categoryname: string
  gradedategraded: number
  gradedatesubmitted: number
  gradeformatted: string
  graderaw: number
  grademax: number
  grademin: number
  percentageformatted: string
  feedback: string
  locked: boolean
  hidden: boolean
}

interface GradeBookProps {
  courseId?: number | null
}

export default function GradeBook({ courseId }: GradeBookProps) {
  const { moodleAPI, user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const {
    data: grades,
    isLoading,
    error,
  } = useQuery(
    ['grades', courseId, user?.id],
    () => moodleAPI!.getUserGrades(courseId!, user!.id),
    {
      enabled: !!moodleAPI && !!courseId && !!user,
      staleTime: 5 * 60 * 1000,
    }
  )

  const {
    data: courseGrades,
    isLoading: courseGradesLoading,
  } = useQuery(
    ['course-grades', user?.id],
    () => moodleAPI!.getAllUserGrades(user!.id),
    {
      enabled: !!moodleAPI && !!user && !courseId,
      staleTime: 5 * 60 * 1000,
    }
  )

  if (!courseId) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Grade Overview</h3>
            <p className="text-gray-600">
              Select a course to view detailed grades, or view your overall academic performance below.
            </p>
          </div>
        </div>

        {/* Overall Performance Summary */}
        {courseGradesLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white bg-opacity-20">
                  <Award className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-100">Overall GPA</p>
                  <p className="text-2xl font-bold">3.85</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white bg-opacity-20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-green-100">Courses Passed</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white bg-opacity-20">
                  <Target className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-yellow-100">Current Average</p>
                  <p className="text-2xl font-bold">87.5%</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white bg-opacity-20">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-purple-100">Credits Earned</p>
                  <p className="text-2xl font-bold">45</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load grades.</p>
          <p className="text-sm text-gray-600 mt-2">
            You may not have permission to view grades for this course.
          </p>
        </div>
      </div>
    )
  }

  if (!grades || grades.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No grades available for this course yet.</p>
        </div>
      </div>
    )
  }

  const categories = Array.from(new Set(grades.map(g => g.categoryname)))
  const filteredGrades = selectedCategory === 'all' 
    ? grades 
    : grades.filter(g => g.categoryname === selectedCategory)

  const calculateAverage = (gradesList: Grade[]) => {
    const validGrades = gradesList.filter(g => g.graderaw !== null && g.graderaw !== undefined)
    if (validGrades.length === 0) return 0
    const sum = validGrades.reduce((acc, g) => acc + (g.graderaw / g.grademax) * 100, 0)
    return Math.round(sum / validGrades.length * 100) / 100
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50'
    if (percentage >= 80) return 'text-blue-600 bg-blue-50'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50'
    if (percentage >= 60) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Grade Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Course Average</h3>
          <p className="text-3xl font-bold">{calculateAverage(grades)}%</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Assignments</h3>
          <p className="text-3xl font-bold text-gray-700">{grades.length}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">
            {grades.filter(g => g.graderaw !== null).length}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Grades</h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((grade) => {
                const percentage = grade.graderaw ? (grade.graderaw / grade.grademax) * 100 : 0
                
                return (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {grade.itemname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {grade.categoryname}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grade.gradeformatted || 'Not graded'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Max: {grade.grademax}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {grade.graderaw !== null ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(percentage)}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {grade.gradedatesubmitted ? formatDate(grade.gradedatesubmitted) : 'Not submitted'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {grade.feedback || 'No feedback'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}