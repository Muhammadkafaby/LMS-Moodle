'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import { MoodleAssignment } from '@/lib/moodleAPI'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { Upload, File, X, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface AssignmentUploadProps {
  courseId?: number | null
}

export default function AssignmentUpload({ courseId }: AssignmentUploadProps) {
  const { moodleAPI } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedAssignment, setSelectedAssignment] = useState<MoodleAssignment | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [submissionText, setSubmissionText] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery(
    ['assignments', courseId],
    () => moodleAPI!.getAssignments(courseId ? [courseId] : []),
    {
      enabled: !!moodleAPI && !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  )

  const submitMutation = useMutation(
    async () => {
      if (!selectedAssignment) throw new Error('No assignment selected')
      return moodleAPI!.submitAssignment(selectedAssignment.id, selectedFiles, submissionText)
    },
    {
      onSuccess: () => {
        toast.success('Assignment submitted successfully!')
        setSelectedFiles([])
        setSubmissionText('')
        setSelectedAssignment(null)
        queryClient.invalidateQueries(['assignments'])
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to submit assignment')
      },
    }
  )

  const assignments = assignmentsData?.courses?.[0]?.assignments || []

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getAssignmentStatus = (assignment: MoodleAssignment) => {
    const now = Date.now() / 1000
    const dueDate = assignment.duedate
    const cutoffDate = assignment.cutoffdate

    if (cutoffDate && now > cutoffDate) {
      return { status: 'closed', color: 'red', icon: X, text: 'Closed' }
    }
    if (dueDate && now > dueDate) {
      return { status: 'overdue', color: 'orange', icon: AlertCircle, text: 'Overdue' }
    }
    if (dueDate && now > dueDate - 86400) { // 24 hours before due
      return { status: 'due-soon', color: 'yellow', icon: Clock, text: 'Due Soon' }
    }
    return { status: 'open', color: 'green', icon: CheckCircle, text: 'Open' }
  }

  if (!courseId) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Assignments</h3>
          <p className="text-gray-600">
            Please select a course first to view and submit assignments.
          </p>
        </div>
      </div>
    )
  }

  if (assignmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (assignmentsError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load assignments.</p>
          <p className="text-sm text-gray-600 mt-2">
            Make sure the course has assignments or you have permission to view them.
          </p>
        </div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No assignments found in this course.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Assignment Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Assignment
        </h2>
        
        <div className="space-y-3">
          {assignments.map((assignment: MoodleAssignment) => {
            const status = getAssignmentStatus(assignment)
            const StatusIcon = status.icon
            
            return (
              <div
                key={assignment.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedAssignment?.id === assignment.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAssignment(assignment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{assignment.name}</h3>
                    {assignment.intro && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {assignment.intro.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {assignment.duedate > 0 && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Due: {formatDate(assignment.duedate)}</span>
                        </div>
                      )}
                      <div>Grade: {assignment.grade}</div>
                      <div>Max attempts: {assignment.maxattempts}</div>
                    </div>
                  </div>
                  
                  <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800 flex items-center`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* File Upload Section */}
      {selectedAssignment && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Submit: {selectedAssignment.name}
          </h3>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-gray-500">
              Support for PDF, DOC, DOCX, TXT, ZIP, images and more
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.gif"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Selected Files:</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <File className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Text */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submission Text (Optional)
            </label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={4}
              className="input-field"
              placeholder="Add any comments or explanations for your submission..."
            />
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isLoading}
              disabled={selectedFiles.length === 0 && !submissionText.trim()}
              icon={<Upload className="w-4 h-4" />}
            >
              Submit Assignment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}