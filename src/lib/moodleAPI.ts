import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { demoUser, demoCourses, demoAssignments, demoSearchResults, DEMO_CONFIG } from './demoData'

export interface MoodleConfig {
  baseUrl: string
  token: string
  demoMode?: boolean
}

export interface MoodleUser {
  id: number
  username: string
  firstname: string
  lastname: string
  fullname: string
  email: string
  profileimageurl?: string
}

export interface MoodleCourse {
  id: number
  fullname: string
  shortname: string
  categoryid: number
  summary: string
  summaryformat: number
  format: string
  showgrades: boolean
  lang: string
  enablecompletion: boolean
  completionhascriteria: boolean
  completionusertracked: boolean
  category: string
  progress?: number
  completed?: boolean
  marker?: number
  lastaccess?: number
  isfavourite?: boolean
  hidden?: boolean
  overviewfiles?: any[]
}

export interface MoodleAssignment {
  id: number
  course: number
  name: string
  intro: string
  introformat: number
  alwaysshowdescription: boolean
  nosubmissions: boolean
  submissiondrafts: boolean
  sendnotifications: boolean
  sendlatenotifications: boolean
  sendstudentnotifications: boolean
  duedate: number
  allowsubmissionsfromdate: number
  grade: number
  timemodified: number
  completionsubmit: boolean
  cutoffdate: number
  gradingduedate: number
  teamsubmission: boolean
  requireallteammemberssubmit: boolean
  teamsubmissiongroupingid: number
  blindmarking: boolean
  hidegrader: boolean
  revealidentities: boolean
  attemptreopenmethod: string
  maxattempts: number
  markingworkflow: boolean
  markingallocation: boolean
  requiresubmissionstatement: boolean
  preventsubmissionnotingroup: boolean
  configs?: any[]
}

export interface MoodleSubmission {
  assignment: number
  files: File[]
  submissiontext?: string
}

export interface MoodleSearchResult {
  areaid: string
  courseid: number
  title: string
  content: string
  contextid: number
  type: string
  url: string
}

class MoodleAPI {
  private api: AxiosInstance
  private config: MoodleConfig

  constructor(config: MoodleConfig) {
    this.config = config
    
    // Skip API setup in demo mode
    if (config.demoMode) {
      console.log('🎭 Demo Mode: Using mock data for testing')
      return
    }
    
    this.api = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
    })

    this.api.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        wstoken: this.config.token,
        moodlewsrestformat: 'json',
      }
      return config
    })
  }

  private async makeRequest<T>(wsfunction: string, params: any = {}): Promise<T> {
    // Return demo data in demo mode
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      return {} as T // Will be overridden by specific methods
    }
    
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wsfunction,
          ...params,
        },
      })

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API Error')
      }

      return response.data
    } catch (error) {
      console.error('Moodle API Error:', error)
      throw error
    }
  }

  // Authentication and User Management
  async getSiteInfo(): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        sitename: 'Demo Moodle Site',
        username: demoUser.username,
        firstname: demoUser.firstname,
        lastname: demoUser.lastname,
        fullname: demoUser.fullname,
        userid: demoUser.id,
        useremail: demoUser.email,
        userpictureurl: demoUser.profileimageurl,
        release: '4.3+ (Demo)'
      }
    }
    return this.makeRequest('core_webservice_get_site_info')
  }

  async getUserInfo(): Promise<MoodleUser> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 200))
      return demoUser
    }
    
    const siteInfo = await this.getSiteInfo()
    return {
      id: siteInfo.userid,
      username: siteInfo.username,
      firstname: siteInfo.firstname,
      lastname: siteInfo.lastname,
      fullname: siteInfo.fullname,
      email: siteInfo.useremail,
      profileimageurl: siteInfo.userpictureurl,
    }
  }

  // Course Management
  async getUserCourses(userid?: number): Promise<MoodleCourse[]> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return demoCourses
    }
    return this.makeRequest('core_enrol_get_users_courses', { userid })
  }

  async getCourseContents(courseid: number): Promise<any> {
    return this.makeRequest('core_course_get_contents', { courseid })
  }

  async getCoursesByField(field: string = 'ids', value: string = ''): Promise<MoodleCourse[]> {
    return this.makeRequest('core_course_get_courses_by_field', { field, value })
  }

  // Assignment Management
  async getAssignments(courseids: number[]): Promise<{ courses: { assignments: MoodleAssignment[] }[] }> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 600))
      const filteredAssignments = demoAssignments.filter(assignment => 
        courseids.includes(assignment.course)
      )
      return {
        courses: [{
          assignments: filteredAssignments
        }]
      }
    }
    return this.makeRequest('mod_assign_get_assignments', { courseids })
  }

  async getAssignmentSubmissionStatus(assignid: number, userid?: number): Promise<any> {
    return this.makeRequest('mod_assign_get_submission_status', { assignid, userid })
  }

  async submitAssignment(assignmentid: number, files: File[], submissiontext?: string): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate upload time
      console.log('🎭 Demo: Assignment submitted successfully!', { assignmentid, files: files.map(f => f.name), submissiontext })
      return { success: true, message: 'Assignment submitted successfully (Demo Mode)' }
    }
    
    // First, upload files
    const uploadedFiles = await Promise.all(
      files.map(file => this.uploadFile(file))
    )

    // Then submit the assignment
    const itemid = Date.now() // Use timestamp as itemid
    return this.makeRequest('mod_assign_save_submission', {
      assignmentid,
      plugindata: {
        files_filemanager: itemid,
        onlinetext_editor: {
          text: submissiontext || '',
          format: 1,
          itemid: itemid
        }
      }
    })
  }

  // File Management
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file_1', file)
    formData.append('token', this.config.token)
    formData.append('component', 'user')
    formData.append('filearea', 'draft')
    formData.append('itemid', Date.now().toString())
    formData.append('filepath', '/')
    formData.append('filename', file.name)

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/webservice/upload.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  // Search
  async searchContent(query: string, courseid?: number): Promise<MoodleSearchResult[]> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 800))
      return demoSearchResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.content.toLowerCase().includes(query.toLowerCase())
      ).filter(result => courseid ? result.courseid === courseid : true)
    }
    
    const params: any = { q: query }
    if (courseid) {
      params.courseids = [courseid]
    }
    
    try {
      const result = await this.makeRequest('core_search_get_results', params)
      return result.results || []
    } catch (error) {
      // Fallback: search in course contents if global search is not available
      if (courseid) {
        const contents = await this.getCourseContents(courseid)
        return this.searchInCourseContents(contents, query)
      }
      throw error
    }
  }

  private searchInCourseContents(contents: any[], query: string): MoodleSearchResult[] {
    const results: MoodleSearchResult[] = []
    const searchTerm = query.toLowerCase()

    contents.forEach(section => {
      section.modules?.forEach((module: any) => {
        if (
          module.name?.toLowerCase().includes(searchTerm) ||
          module.description?.toLowerCase().includes(searchTerm)
        ) {
          results.push({
            areaid: 'mod_' + module.modname,
            courseid: section.id,
            title: module.name,
            content: module.description || '',
            contextid: module.id,
            type: module.modname,
            url: module.url || '#'
          })
        }
      })
    })

    return results
  }

  // Grade Management
  async getUserGrades(courseid: number, userid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return [
        {
          id: 1,
          itemname: 'Assignment 1',
          categoryid: 1,
          categoryname: 'Assignments',
          gradedategraded: Date.now() / 1000,
          gradedatesubmitted: Date.now() / 1000 - 86400,
          gradeformatted: '85/100',
          graderaw: 85,
          grademax: 100,
          grademin: 0,
          percentageformatted: '85%',
          feedback: 'Good work! Well structured and clear.',
          locked: false,
          hidden: false
        },
        {
          id: 2,
          itemname: 'Quiz 1',
          categoryid: 2,
          categoryname: 'Quizzes',
          gradedategraded: Date.now() / 1000 - 86400,
          gradedatesubmitted: Date.now() / 1000 - 86400,
          gradeformatted: '92/100',
          graderaw: 92,
          grademax: 100,
          grademin: 0,
          percentageformatted: '92%',
          feedback: 'Excellent understanding of the material.',
          locked: false,
          hidden: false
        }
      ]
    }
    return this.makeRequest('core_grades_get_grades', { courseid, userid })
  }

  async getAllUserGrades(userid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { gpa: 3.85, totalCourses: 12, averageGrade: 87.5, creditsEarned: 45 }
    }
    return this.makeRequest('gradereport_user_get_grades_table', { userid })
  }

  // Calendar Management
  async getCalendarEvents(timestart: number, timeend: number, courseid?: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const now = Date.now() / 1000
      return [
        {
          id: 1,
          name: 'Assignment 2 Due',
          description: 'Submit your research paper on renewable energy',
          timestart: now + 86400 * 3,
          timeduration: 0,
          courseid: courseid || 1,
          coursename: 'Environmental Science',
          eventtype: 'assignment',
          location: 'Online',
          url: '#'
        },
        {
          id: 2,
          name: 'Midterm Exam',
          description: 'Comprehensive midterm covering chapters 1-5',
          timestart: now + 86400 * 7,
          timeduration: 7200,
          courseid: courseid || 2,
          coursename: 'Computer Science',
          eventtype: 'quiz',
          location: 'Room 101',
          url: '#'
        }
      ]
    }
    
    const params: any = { 
      'events[eventids]': [],
      'events[courseids]': courseid ? [courseid] : [],
      'events[groupids]': [],
      'events[categoryids]': [],
      'options[timestart]': timestart,
      'options[timeend]': timeend
    }
    
    return this.makeRequest('core_calendar_get_calendar_events', params)
  }

  // Forum Management
  async getForums(courseid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return [
        {
          id: 1,
          course: courseid,
          name: 'General Discussion',
          intro: 'General course discussion and questions',
          discussions: 15,
          posts: 87
        },
        {
          id: 2,
          course: courseid,
          name: 'Assignment Help',
          intro: 'Get help with assignments and projects',
          discussions: 8,
          posts: 45
        }
      ]
    }
    return this.makeRequest('mod_forum_get_forums_by_courses', { courseids: [courseid] })
  }

  async getForumDiscussions(forumid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return [
        {
          id: 1,
          course: 1,
          forum: forumid,
          name: 'Welcome to the course!',
          firstpost: 1,
          userid: 2,
          groupid: 0,
          timemodified: Date.now() / 1000 - 86400,
          userfullname: 'Dr. Smith',
          numreplies: 12,
          pinned: true,
          locked: false,
          starred: false,
          canreply: true,
          message: 'Welcome everyone to our course. Please introduce yourselves!'
        }
      ]
    }
    return this.makeRequest('mod_forum_get_forum_discussions', { forumid })
  }

  async getForumPosts(discussionid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return [
        {
          id: 1,
          discussion: discussionid,
          parent: 0,
          userid: 2,
          created: Date.now() / 1000 - 86400,
          modified: Date.now() / 1000 - 86400,
          subject: 'Welcome to the course!',
          message: 'Welcome everyone to our course. Please introduce yourselves and share what you hope to learn!',
          userfullname: 'Dr. Smith',
          userpictureurl: '',
          totalscore: 5,
          replies: []
        }
      ]
    }
    return this.makeRequest('mod_forum_get_forum_discussion_posts', { discussionid })
  }

  async createForumPost(discussionid: number, message: string, parentid?: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 800))
      return { success: true, postid: Date.now() }
    }
    
    const params: any = {
      posts: [{
        discussionid,
        subject: parentid ? 'Re:' : 'New Post',
        message,
        messageformat: 1,
        parentid: parentid || 0
      }]
    }
    
    return this.makeRequest('mod_forum_add_discussion_post', params)
  }

  async createForumDiscussion(forumid: number, subject: string, message: string): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, discussionid: Date.now() }
    }
    
    const params = {
      forumid,
      subject,
      message,
      messageformat: 1,
      groupid: 0
    }
    
    return this.makeRequest('mod_forum_add_discussion', params)
  }

  // Quiz Management
  async getQuizzes(courseid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const now = Date.now() / 1000
      return [
        {
          id: 1,
          course: courseid,
          name: 'Chapter 1 Quiz',
          intro: 'Test your understanding of the first chapter concepts',
          timeopen: now - 86400 * 7,
          timeclose: now + 86400 * 7,
          timelimit: 1800,
          attempts: 2,
          grade: 100
        }
      ]
    }
    return this.makeRequest('mod_quiz_get_quizzes_by_courses', { courseids: [courseid] })
  }

  async getQuizAttempts(quizid: number, userid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return [
        {
          id: 1,
          quiz: quizid,
          userid,
          attempt: 1,
          state: 'finished',
          timestart: Date.now() / 1000 - 86400,
          timefinish: Date.now() / 1000 - 86400 + 1500,
          sumgrades: 85
        }
      ]
    }
    return this.makeRequest('mod_quiz_get_user_attempts', { quizid, userid })
  }

  async getQuizQuestions(attemptid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return [
        {
          id: 1,
          name: 'Question 1',
          questiontext: 'What is the capital of France?',
          qtype: 'multichoice',
          defaultmark: 10
        },
        {
          id: 2,
          name: 'Question 2',
          questiontext: 'Explain the concept of photosynthesis.',
          qtype: 'essay',
          defaultmark: 20
        }
      ]
    }
    return this.makeRequest('mod_quiz_get_attempt_data', { attemptid })
  }

  async startQuizAttempt(quizid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 800))
      return {
        id: Date.now(),
        quiz: quizid,
        attempt: 1,
        state: 'inprogress',
        timestart: Date.now() / 1000
      }
    }
    return this.makeRequest('mod_quiz_start_attempt', { quizid })
  }

  async submitQuizAttempt(attemptid: number, answers: Record<number, any>): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 1200))
      return { success: true, grade: Math.floor(Math.random() * 40) + 60 }
    }
    
    const params = {
      attemptid,
      data: Object.entries(answers).map(([questionId, answer]) => ({
        name: `q${questionId}:sequencecheck`,
        value: answer
      }))
    }
    
    return this.makeRequest('mod_quiz_process_attempt', params)
  }

  // User Profile Management
  async getUserProfile(userid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        ...demoUser,
        description: 'Passionate learner interested in technology and science.',
        city: 'San Francisco',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        firstaccess: Date.now() / 1000 - 86400 * 365,
        lastaccess: Date.now() / 1000 - 3600,
        lastlogin: Date.now() / 1000 - 86400,
        currentlogin: Date.now() / 1000,
        lang: 'en',
        theme: 'standard',
        mailformat: 1,
        maildigest: 0,
        maildisplay: 1,
        autosubscribe: true,
        trackforums: true,
        completed: true,
        suspended: false,
        confirmed: true,
        customfields: [],
        preferences: []
      }
    }
    return this.makeRequest('core_user_get_users_by_field', { field: 'id', values: [userid] })
  }

  async updateUserProfile(userid: number, updates: any): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return { success: true }
    }
    return this.makeRequest('core_user_update_users', { users: [{ id: userid, ...updates }] })
  }

  async uploadProfileImage(userid: number, file: File): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, url: URL.createObjectURL(file) }
    }
    
    const uploadResult = await this.uploadFile(file)
    return this.makeRequest('core_user_update_picture', { 
      userid,
      draftitemid: uploadResult.itemid 
    })
  }

  // Notification Management
  async getNotifications(userid: number, filter: 'all' | 'unread' | 'read' = 'all'): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 200))
      const notifications = [
        {
          id: 1,
          subject: 'New assignment posted',
          smallmessage: 'Assignment 3 has been posted in Environmental Science',
          eventtype: 'assign',
          component: 'mod_assign',
          timecreated: Date.now() / 1000 - 3600,
          timeread: 0,
          read: false,
          contexturl: '#',
          contexturlname: 'View Assignment'
        },
        {
          id: 2,
          subject: 'Grade updated',
          smallmessage: 'Your grade for Quiz 1 has been updated',
          eventtype: 'grade',
          component: 'core_grades',
          timecreated: Date.now() / 1000 - 7200,
          timeread: Date.now() / 1000 - 3600,
          read: true,
          contexturl: '#',
          contexturlname: 'View Grade'
        }
      ]
      
      return notifications.filter(n => {
        if (filter === 'unread') return !n.read
        if (filter === 'read') return n.read
        return true
      })
    }
    
    const params: any = { useridto: userid }
    if (filter === 'unread') params.read = 0
    if (filter === 'read') params.read = 1
    
    return this.makeRequest('message_popup_get_popup_notifications', params)
  }

  async markNotificationAsRead(notificationid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 200))
      return { success: true }
    }
    return this.makeRequest('core_message_mark_notification_read', { notificationid })
  }

  async markAllNotificationsAsRead(userid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    }
    return this.makeRequest('core_message_mark_all_notifications_as_read', { useridto: userid })
  }

  async deleteNotification(notificationid: number): Promise<any> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { success: true }
    }
    return this.makeRequest('core_message_delete_message', { messageid: notificationid })
  }

  // Utility method to validate token
  async validateToken(): Promise<boolean> {
    if (this.config.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 200))
      return true
    }
    
    try {
      await this.getSiteInfo()
      return true
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance creator
export const createMoodleAPI = (config: MoodleConfig): MoodleAPI => {
  return new MoodleAPI(config)
}

export default MoodleAPI