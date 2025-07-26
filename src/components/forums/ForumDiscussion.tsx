'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { MessageSquare, Reply, ThumbsUp, Pin, Lock, Users, Clock, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface ForumPost {
  id: number
  discussion: number
  parent: number
  userid: number
  created: number
  modified: number
  mailed: boolean
  subject: string
  message: string
  messageformat: number
  messagetrust: boolean
  attachment: boolean
  totalscore: number
  mailnow: boolean
  userfullname: string
  userpictureurl?: string
  deleted: boolean
  replies?: ForumPost[]
}

interface ForumDiscussion {
  id: number
  course: number
  forum: number
  name: string
  firstpost: number
  userid: number
  groupid: number
  assessed: boolean
  timemodified: number
  usermodified: number
  timestart: number
  timeend: number
  discussion: number
  parent: number
  created: number
  modified: number
  mailed: boolean
  subject: string
  message: string
  messageformat: number
  messagetrust: boolean
  attachment: boolean
  totalscore: number
  mailnow: boolean
  userfullname: string
  userpictureurl?: string
  numreplies: number
  pinned: boolean
  locked: boolean
  starred: boolean
  canreply: boolean
}

interface ForumDiscussionProps {
  courseId?: number | null
}

export default function ForumDiscussion({ courseId }: ForumDiscussionProps) {
  const { moodleAPI, user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedForum, setSelectedForum] = useState<number | null>(null)
  const [selectedDiscussion, setSelectedDiscussion] = useState<number | null>(null)
  const [newPost, setNewPost] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [showNewDiscussion, setShowNewDiscussion] = useState(false)
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('')
  const [newDiscussionContent, setNewDiscussionContent] = useState('')

  const {
    data: forums,
    isLoading: forumsLoading,
  } = useQuery(
    ['forums', courseId],
    () => moodleAPI!.getForums(courseId!),
    {
      enabled: !!moodleAPI && !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  )

  const {
    data: discussions,
    isLoading: discussionsLoading,
  } = useQuery(
    ['discussions', selectedForum],
    () => moodleAPI!.getForumDiscussions(selectedForum!),
    {
      enabled: !!moodleAPI && !!selectedForum,
      staleTime: 2 * 60 * 1000,
    }
  )

  const {
    data: posts,
    isLoading: postsLoading,
  } = useQuery(
    ['posts', selectedDiscussion],
    () => moodleAPI!.getForumPosts(selectedDiscussion!),
    {
      enabled: !!moodleAPI && !!selectedDiscussion,
      staleTime: 1 * 60 * 1000,
    }
  )

  const createPostMutation = useMutation(
    async ({ discussionId, message, parentId }: { discussionId: number, message: string, parentId?: number }) => {
      return moodleAPI!.createForumPost(discussionId, message, parentId)
    },
    {
      onSuccess: () => {
        toast.success('Post created successfully!')
        setNewPost('')
        setReplyTo(null)
        queryClient.invalidateQueries(['posts', selectedDiscussion])
      },
      onError: () => {
        toast.error('Failed to create post')
      },
    }
  )

  const createDiscussionMutation = useMutation(
    async ({ forumId, subject, message }: { forumId: number, subject: string, message: string }) => {
      return moodleAPI!.createForumDiscussion(forumId, subject, message)
    },
    {
      onSuccess: () => {
        toast.success('Discussion created successfully!')
        setNewDiscussionTitle('')
        setNewDiscussionContent('')
        setShowNewDiscussion(false)
        queryClient.invalidateQueries(['discussions', selectedForum])
      },
      onError: () => {
        toast.error('Failed to create discussion')
      },
    }
  )

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - (timestamp * 1000)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  const renderPost = (post: ForumPost, depth = 0) => (
    <div key={post.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="card hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {post.userpictureurl ? (
              <img src={post.userpictureurl} alt={post.userfullname} className="w-10 h-10 rounded-full" />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {post.userfullname.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{post.userfullname}</h4>
                <p className="text-sm text-gray-600">{formatRelativeTime(post.created)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {post.totalscore > 0 && (
                  <div className="flex items-center text-sm text-green-600">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    <span>{post.totalscore}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyTo(post.id)}
                  icon={<Reply className="w-3 h-3" />}
                >
                  Reply
                </Button>
              </div>
            </div>
            
            {post.subject && post.subject !== 'Re:' && (
              <h5 className="font-medium text-gray-800 mt-2">{post.subject}</h5>
            )}
            
            <div className="mt-2 prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.message }} />
            </div>
            
            {replyTo === post.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h6 className="font-medium text-gray-900 mb-2">Reply to {post.userfullname}</h6>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Write your reply..."
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setReplyTo(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => createPostMutation.mutate({
                      discussionId: selectedDiscussion!,
                      message: newPost,
                      parentId: post.id
                    })}
                    loading={createPostMutation.isLoading}
                    disabled={!newPost.trim()}
                  >
                    Post Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {post.replies && post.replies.map(reply => renderPost(reply, depth + 1))}
    </div>
  )

  if (!courseId) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course Forums</h3>
          <p className="text-gray-600">
            Select a course to view and participate in discussions.
          </p>
        </div>
      </div>
    )
  }

  if (forumsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Forum Selection View
  if (!selectedForum) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Course Forums</h2>
          </div>
          
          {forums && forums.length > 0 ? (
            <div className="space-y-3">
              {forums.map((forum: any) => (
                <div
                  key={forum.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedForum(forum.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{forum.name}</h3>
                      {forum.intro && (
                        <p className="text-sm text-gray-600 mt-1">
                          {forum.intro.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{forum.discussions || 0} discussions</span>
                        <span>{forum.posts || 0} posts</span>
                      </div>
                    </div>
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No forums available in this course.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Discussion List View
  if (!selectedDiscussion) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedForum(null)}>
                ← Back to Forums
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">Discussions</h2>
            </div>
            <Button
              onClick={() => setShowNewDiscussion(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              New Discussion
            </Button>
          </div>

          {showNewDiscussion && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Start New Discussion</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                  placeholder="Discussion title..."
                  className="input-field"
                />
                <textarea
                  value={newDiscussionContent}
                  onChange={(e) => setNewDiscussionContent(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Start the discussion..."
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewDiscussion(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createDiscussionMutation.mutate({
                      forumId: selectedForum,
                      subject: newDiscussionTitle,
                      message: newDiscussionContent
                    })}
                    loading={createDiscussionMutation.isLoading}
                    disabled={!newDiscussionTitle.trim() || !newDiscussionContent.trim()}
                  >
                    Create Discussion
                  </Button>
                </div>
              </div>
            </div>
          )}

          {discussionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="large" />
            </div>
          ) : discussions && discussions.length > 0 ? (
            <div className="space-y-3">
              {discussions.map((discussion: ForumDiscussion) => (
                <div
                  key={discussion.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedDiscussion(discussion.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {discussion.pinned && <Pin className="w-4 h-4 text-orange-500" />}
                        {discussion.locked && <Lock className="w-4 h-4 text-red-500" />}
                        <h3 className="font-medium text-gray-900">{discussion.name}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>by {discussion.userfullname}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formatRelativeTime(discussion.timemodified)}</span>
                        </div>
                        <span>{discussion.numreplies} replies</span>
                      </div>
                      
                      {discussion.message && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {discussion.message.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                    </div>
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No discussions in this forum yet.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Posts View
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedDiscussion(null)}>
              ← Back to Discussions
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">Discussion Posts</h2>
          </div>
        </div>

        {postsLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="large" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.filter((post: ForumPost) => post.parent === 0).map((post: ForumPost) => renderPost(post))}
            
            {/* Add new post */}
            {!replyTo && (
              <div className="card bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Add to Discussion</h4>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Share your thoughts..."
                />
                <div className="flex justify-end mt-3">
                  <Button
                    onClick={() => createPostMutation.mutate({
                      discussionId: selectedDiscussion,
                      message: newPost
                    })}
                    loading={createPostMutation.isLoading}
                    disabled={!newPost.trim()}
                  >
                    Post Message
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No posts in this discussion yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}