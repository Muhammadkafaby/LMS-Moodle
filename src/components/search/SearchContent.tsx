'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import { MoodleSearchResult } from '@/lib/moodleAPI'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { Search, ExternalLink, FileText, Video, Image, Link as LinkIcon } from 'lucide-react'

interface SearchContentProps {
  courseId?: number | null
}

export default function SearchContent({ courseId }: SearchContentProps) {
  const { moodleAPI } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTrigger, setSearchTrigger] = useState('')

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery<MoodleSearchResult[]>(
    ['search', searchTrigger, courseId],
    () => moodleAPI!.searchContent(searchTrigger, courseId || undefined),
    {
      enabled: !!moodleAPI && !!searchTrigger,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchTrigger(searchQuery.trim())
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'resource':
      case 'file':
        return <FileText className="w-4 h-4" />
      case 'url':
        return <LinkIcon className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'resource':
      case 'file':
        return 'bg-blue-100 text-blue-800'
      case 'url':
        return 'bg-green-100 text-green-800'
      case 'video':
        return 'bg-purple-100 text-purple-800'
      case 'forum':
        return 'bg-orange-100 text-orange-800'
      case 'quiz':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Search Learning Materials
        </h2>
        
        {courseId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Searching in Course ID: {courseId}
            </p>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={courseId ? "Search in selected course..." : "Search all accessible content..."}
              className="input-field pl-10"
            />
          </div>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!searchQuery.trim()}
          >
            Search
          </Button>
        </form>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="large" />
        </div>
      )}

      {error && (
        <div className="card">
          <div className="text-center py-4">
            <p className="text-red-600">
              Search failed. This might happen if global search is not enabled on your Moodle site.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Try selecting a specific course first for more targeted results.
            </p>
          </div>
        </div>
      )}

      {searchResults && searchResults.length === 0 && searchTrigger && (
        <div className="card">
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No results found for &quot;{searchTrigger}&quot;</p>
            <p className="text-sm text-gray-500 mt-2">
              Try different keywords or select a specific course.
            </p>
          </div>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h3>
            <p className="text-sm text-gray-600">
              Showing results for &quot;{searchTrigger}&quot;
            </p>
          </div>

          <div className="space-y-3">
            {searchResults.map((result, index) => (
              <div key={index} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-md ${getTypeColor(result.type)}`}>
                    {getTypeIcon(result.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900 leading-tight">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightText(result.title, searchTrigger)
                          }}
                        />
                      </h4>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
                        {result.type}
                      </span>
                    </div>
                    
                    {result.content && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightText(
                              result.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
                              searchTrigger
                            )
                          }}
                        />
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>Course ID: {result.courseid}</span>
                        <span>Area: {result.areaid}</span>
                      </div>
                      
                      {result.url && result.url !== '#' && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!searchTrigger && (
        <div className="card">
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search Learning Materials</h3>
            <p className="text-gray-600 mb-4">
              Find course content, resources, assignments, and more.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Search across all your accessible courses</p>
              <p>• Use keywords to find specific content</p>
              <p>• Select a course for more targeted results</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}