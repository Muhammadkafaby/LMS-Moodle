'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from './Header'
import Sidebar from './Sidebar'
import CourseList from '../courses/CourseList'
import SearchContent from '../search/SearchContent'
import AssignmentUpload from '../assignments/AssignmentUpload'
import GradeBook from '../grades/GradeBook'
import Calendar from '../calendar/Calendar'
import ForumDiscussion from '../forums/ForumDiscussion'
import QuizSystem from '../quiz/QuizSystem'
import UserProfile from '../profile/UserProfile'
import NotificationSystem from '../notifications/NotificationSystem'

export type DashboardView = 
  | 'courses' 
  | 'search' 
  | 'assignments' 
  | 'grades' 
  | 'calendar' 
  | 'forums' 
  | 'quizzes' 
  | 'profile' 
  | 'notifications'

export default function Dashboard() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<DashboardView>('courses')
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)

  const renderContent = () => {
    switch (currentView) {
      case 'courses':
        return (
          <CourseList 
            onCourseSelect={setSelectedCourseId}
            selectedCourseId={selectedCourseId}
          />
        )
      case 'search':
        return (
          <SearchContent 
            courseId={selectedCourseId}
          />
        )
      case 'assignments':
        return (
          <AssignmentUpload 
            courseId={selectedCourseId}
          />
        )
      case 'grades':
        return (
          <GradeBook 
            courseId={selectedCourseId}
          />
        )
      case 'calendar':
        return (
          <Calendar 
            courseId={selectedCourseId}
          />
        )
      case 'forums':
        return (
          <ForumDiscussion 
            courseId={selectedCourseId}
          />
        )
      case 'quizzes':
        return (
          <QuizSystem 
            courseId={selectedCourseId}
          />
        )
      case 'profile':
        return <UserProfile />
      case 'notifications':
        return <NotificationSystem />
      default:
        return <CourseList onCourseSelect={setSelectedCourseId} selectedCourseId={selectedCourseId} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          selectedCourseId={selectedCourseId}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstname}!
              </h1>
              <p className="text-gray-600 mt-1">
                {currentView === 'courses' && 'Manage your enrolled courses'}
                {currentView === 'search' && 'Search for learning materials'}
                {currentView === 'assignments' && 'Upload assignments and submissions'}
                {currentView === 'grades' && 'View your grades and academic performance'}
                {currentView === 'calendar' && 'Manage your schedule and deadlines'}
                {currentView === 'forums' && 'Participate in course discussions'}
                {currentView === 'quizzes' && 'Take quizzes and assessments'}
                {currentView === 'profile' && 'Manage your profile and settings'}
                {currentView === 'notifications' && 'View your notifications and updates'}
              </p>
            </div>
            
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}