'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { Clock, CheckCircle, AlertTriangle, Play, RotateCcw, BookOpen, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

interface Quiz {
  id: number
  course: number
  name: string
  intro: string
  timeopen: number
  timeclose: number
  timelimit: number
  overduehandling: string
  graceperiod: number
  preferredbehaviour: string
  canredoquestions: boolean
  attempts: number
  attemptonlast: boolean
  grademethod: number
  decimalpoints: number
  questiondecimalpoints: number
  reviewattempt: number
  reviewcorrectness: number
  reviewmarks: number
  reviewspecificfeedback: number
  reviewgeneralfeedback: number
  reviewrightanswer: number
  reviewoverallfeedback: number
  questionsperpage: number
  navmethod: string
  shufflequestions: boolean
  shuffleanswers: boolean
  questions: string
  sumgrades: number
  grade: number
  timecreated: number
  timemodified: number
  password: string
  subnet: string
  browsersecurity: string
  delay1: number
  delay2: number
  showuserpicture: boolean
  showblocks: boolean
  completionattemptsexhausted: boolean
  completionpass: boolean
  allowofflineattempts: boolean
}

interface QuizAttempt {
  id: number
  quiz: number
  userid: number
  attempt: number
  uniqueid: number
  layout: string
  currentpage: number
  preview: boolean
  state: string
  timestart: number
  timefinish: number
  timemodified: number
  timecheckstate: number
  sumgrades: number
}

interface QuizQuestion {
  id: number
  category: number
  parent: number
  name: string
  questiontext: string
  questiontextformat: number
  generalfeedback: string
  generalfeedbackformat: number
  defaultmark: number
  penalty: number
  qtype: string
  length: number
  stamp: string
  version: string
  hidden: boolean
  timecreated: number
  timemodified: number
  createdby: number
  modifiedby: number
}

interface QuizSystemProps {
  courseId?: number | null
}

export default function QuizSystem({ courseId }: QuizSystemProps) {
  const { moodleAPI, user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const {
    data: quizzes,
    isLoading: quizzesLoading,
    error: quizzesError,
  } = useQuery(
    ['quizzes', courseId],
    () => moodleAPI!.getQuizzes(courseId!),
    {
      enabled: !!moodleAPI && !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  )

  const {
    data: attempts,
    isLoading: attemptsLoading,
  } = useQuery(
    ['quiz-attempts', selectedQuiz?.id, user?.id],
    () => moodleAPI!.getQuizAttempts(selectedQuiz!.id, user!.id),
    {
      enabled: !!moodleAPI && !!selectedQuiz && !!user,
      staleTime: 2 * 60 * 1000,
    }
  )

  const {
    data: questions,
    isLoading: questionsLoading,
  } = useQuery(
    ['quiz-questions', currentAttempt?.id],
    () => moodleAPI!.getQuizQuestions(currentAttempt!.id),
    {
      enabled: !!moodleAPI && !!currentAttempt,
      staleTime: 10 * 60 * 1000,
    }
  )

  const startAttemptMutation = useMutation(
    async (quizId: number) => {
      return moodleAPI!.startQuizAttempt(quizId)
    },
    {
      onSuccess: (attempt) => {
        setCurrentAttempt(attempt)
        setAnswers({})
        if (selectedQuiz?.timelimit > 0) {
          setTimeRemaining(selectedQuiz.timelimit)
        }
        toast.success('Quiz attempt started!')
        queryClient.invalidateQueries(['quiz-attempts'])
      },
      onError: () => {
        toast.error('Failed to start quiz attempt')
      },
    }
  )

  const submitAttemptMutation = useMutation(
    async () => {
      return moodleAPI!.submitQuizAttempt(currentAttempt!.id, answers)
    },
    {
      onSuccess: () => {
        setCurrentAttempt(null)
        setAnswers({})
        setTimeRemaining(null)
        toast.success('Quiz submitted successfully!')
        queryClient.invalidateQueries(['quiz-attempts'])
      },
      onError: () => {
        toast.error('Failed to submit quiz')
      },
    }
  )

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getQuizStatus = (quiz: Quiz) => {
    const now = Date.now() / 1000
    
    if (quiz.timeopen > 0 && now < quiz.timeopen) {
      return { status: 'not-open', color: 'gray', text: 'Not Open Yet' }
    }
    if (quiz.timeclose > 0 && now > quiz.timeclose) {
      return { status: 'closed', color: 'red', text: 'Closed' }
    }
    return { status: 'open', color: 'green', text: 'Open' }
  }

  const getAttemptStatus = (attempt: QuizAttempt) => {
    switch (attempt.state) {
      case 'finished':
        return { status: 'finished', color: 'green', text: 'Finished', icon: CheckCircle }
      case 'inprogress':
        return { status: 'inprogress', color: 'yellow', text: 'In Progress', icon: Clock }
      case 'overdue':
        return { status: 'overdue', color: 'red', text: 'Overdue', icon: AlertTriangle }
      default:
        return { status: 'unknown', color: 'gray', text: 'Unknown', icon: Clock }
    }
  }

  const renderQuestion = (question: QuizQuestion, index: number) => {
    return (
      <div key={question.id} className="card">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Question {index + 1}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
            {question.defaultmark} points
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none mb-4">
          <div dangerouslySetInnerHTML={{ __html: question.questiontext }} />
        </div>
        
        {/* Answer input based on question type */}
        <div className="space-y-2">
          {question.qtype === 'multichoice' && (
            <div className="space-y-2">
              {/* This would be populated with actual answer options from the quiz data */}
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="option1"
                  onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                  className="mr-2"
                />
                <span>Option A</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="option2"
                  onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                  className="mr-2"
                />
                <span>Option B</span>
              </label>
            </div>
          )}
          
          {question.qtype === 'essay' && (
            <textarea
              value={answers[question.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
              rows={6}
              className="input-field"
              placeholder="Type your answer here..."
            />
          )}
          
          {question.qtype === 'shortanswer' && (
            <input
              type="text"
              value={answers[question.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
              className="input-field"
              placeholder="Type your answer here..."
            />
          )}
        </div>
      </div>
    )
  }

  if (!courseId) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz System</h3>
          <p className="text-gray-600">
            Select a course to view and take quizzes.
          </p>
        </div>
      </div>
    )
  }

  if (quizzesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (quizzesError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load quizzes.</p>
        </div>
      </div>
    )
  }

  // Taking Quiz View
  if (currentAttempt && questions) {
    return (
      <div className="space-y-6">
        {/* Quiz Header */}
        <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{selectedQuiz?.name}</h2>
              <p className="text-blue-100">Attempt {currentAttempt.attempt}</p>
            </div>
            
            {timeRemaining !== null && (
              <div className="text-right">
                <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
                <p className="text-blue-100">Time Remaining</p>
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question: QuizQuestion, index: number) => renderQuestion(question, index))}
        </div>

        {/* Submit Button */}
        <div className="card bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Progress: {Object.keys(answers).length} of {questions.length} questions answered
              </p>
            </div>
            <Button
              onClick={() => submitAttemptMutation.mutate()}
              loading={submitAttemptMutation.isLoading}
              className="bg-green-600 hover:bg-green-700"
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Submit Quiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Selection View
  if (!selectedQuiz) {
    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Quizzes</h2>
          
          {quizzes && quizzes.length > 0 ? (
            <div className="space-y-4">
              {quizzes.map((quiz: Quiz) => {
                const status = getQuizStatus(quiz)
                
                return (
                  <div
                    key={quiz.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                    onClick={() => setSelectedQuiz(quiz)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{quiz.name}</h3>
                        {quiz.intro && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {quiz.intro.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          {quiz.timeopen > 0 && (
                            <span>Opens: {formatDate(quiz.timeopen)}</span>
                          )}
                          {quiz.timeclose > 0 && (
                            <span>Closes: {formatDate(quiz.timeclose)}</span>
                          )}
                          {quiz.timelimit > 0 && (
                            <span>Time limit: {formatTime(quiz.timelimit)}</span>
                          )}
                          <span>Max attempts: {quiz.attempts}</span>
                          <span>Grade: {quiz.grade}</span>
                        </div>
                      </div>
                      
                      <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium bg-${status.color}-100 text-${status.color}-800`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quizzes available in this course.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Quiz Detail View
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedQuiz(null)}>
            ← Back to Quizzes
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Info */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedQuiz.name}</h2>
            
            {selectedQuiz.intro && (
              <div className="prose prose-sm max-w-none mb-6">
                <div dangerouslySetInnerHTML={{ __html: selectedQuiz.intro }} />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Grade:</strong> {selectedQuiz.grade}
              </div>
              <div>
                <strong>Attempts allowed:</strong> {selectedQuiz.attempts}
              </div>
              {selectedQuiz.timelimit > 0 && (
                <div>
                  <strong>Time limit:</strong> {formatTime(selectedQuiz.timelimit)}
                </div>
              )}
              <div>
                <strong>Questions per page:</strong> {selectedQuiz.questionsperpage}
              </div>
            </div>
          </div>
          
          {/* Attempts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Attempts</h3>
            
            {attemptsLoading ? (
              <LoadingSpinner />
            ) : attempts && attempts.length > 0 ? (
              <div className="space-y-3">
                {attempts.map((attempt: QuizAttempt) => {
                  const status = getAttemptStatus(attempt)
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={attempt.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Attempt {attempt.attempt}</div>
                          <div className="text-sm text-gray-600">
                            {attempt.timefinish ? 
                              `Finished: ${formatDate(attempt.timefinish)}` :
                              `Started: ${formatDate(attempt.timestart)}`
                            }
                          </div>
                          {attempt.sumgrades !== null && (
                            <div className="text-sm font-medium text-green-600">
                              Grade: {attempt.sumgrades}/{selectedQuiz.grade}
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center px-2 py-1 rounded text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.text}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No attempts yet</p>
            )}
            
            {/* Start Attempt Button */}
            <div className="mt-4">
              <Button
                onClick={() => startAttemptMutation.mutate(selectedQuiz.id)}
                loading={startAttemptMutation.isLoading}
                disabled={getQuizStatus(selectedQuiz).status !== 'open'}
                className="w-full"
                icon={<Play className="w-4 h-4" />}
              >
                Start New Attempt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}