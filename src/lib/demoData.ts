import { MoodleUser, MoodleCourse, MoodleAssignment, MoodleSearchResult } from '@/lib/moodleAPI'

// Demo data untuk testing tanpa Moodle
export const demoUser: MoodleUser = {
  id: 1,
  username: 'demo_user',
  firstname: 'Demo',
  lastname: 'User',
  fullname: 'Demo User',
  email: 'demo@example.com',
  profileimageurl: 'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=DU'
}

export const demoCourses: MoodleCourse[] = [
  {
    id: 1,
    fullname: 'Introduction to Web Development',
    shortname: 'WEB101',
    categoryid: 1,
    summary: 'Learn the basics of HTML, CSS, and JavaScript. This comprehensive course covers modern web development techniques and best practices.',
    summaryformat: 1,
    format: 'topics',
    showgrades: true,
    lang: 'en',
    enablecompletion: true,
    completionhascriteria: true,
    completionusertracked: true,
    category: 'Programming',
    progress: 75,
    completed: false,
    lastaccess: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    isfavourite: true,
    hidden: false,
    overviewfiles: []
  },
  {
    id: 2,
    fullname: 'Advanced React Development',
    shortname: 'REACT201',
    categoryid: 1,
    summary: 'Master advanced React concepts including hooks, context, state management, and performance optimization.',
    summaryformat: 1,
    format: 'topics',
    showgrades: true,
    lang: 'en',
    enablecompletion: true,
    completionhascriteria: true,
    completionusertracked: true,
    category: 'Programming',
    progress: 45,
    completed: false,
    lastaccess: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
    isfavourite: false,
    hidden: false,
    overviewfiles: []
  },
  {
    id: 3,
    fullname: 'Database Design and SQL',
    shortname: 'DB101',
    categoryid: 2,
    summary: 'Learn database design principles, SQL queries, and database optimization techniques.',
    summaryformat: 1,
    format: 'topics',
    showgrades: true,
    lang: 'en',
    enablecompletion: true,
    completionhascriteria: false,
    completionusertracked: false,
    category: 'Database',
    progress: 90,
    completed: true,
    lastaccess: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
    isfavourite: false,
    hidden: false,
    overviewfiles: []
  }
]

export const demoAssignments: MoodleAssignment[] = [
  {
    id: 1,
    course: 1,
    name: 'Personal Portfolio Website',
    intro: 'Create a personal portfolio website using HTML, CSS, and JavaScript. Include at least 3 pages: Home, About, and Projects.',
    introformat: 1,
    alwaysshowdescription: true,
    nosubmissions: false,
    submissiondrafts: true,
    sendnotifications: true,
    sendlatenotifications: true,
    sendstudentnotifications: true,
    duedate: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
    allowsubmissionsfromdate: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    grade: 100,
    timemodified: Math.floor(Date.now() / 1000),
    completionsubmit: true,
    cutoffdate: Math.floor(Date.now() / 1000) + 1209600, // 2 weeks from now
    gradingduedate: Math.floor(Date.now() / 1000) + 1814400, // 3 weeks from now
    teamsubmission: false,
    requireallteammemberssubmit: false,
    teamsubmissiongroupingid: 0,
    blindmarking: false,
    hidegrader: false,
    revealidentities: false,
    attemptreopenmethod: 'none',
    maxattempts: 3,
    markingworkflow: false,
    markingallocation: false,
    requiresubmissionstatement: true,
    preventsubmissionnotingroup: false
  },
  {
    id: 2,
    course: 2,
    name: 'React Todo App with Hooks',
    intro: 'Build a todo application using React hooks (useState, useEffect, useContext). Include features: add, edit, delete, and filter todos.',
    introformat: 1,
    alwaysshowdescription: true,
    nosubmissions: false,
    submissiondrafts: true,
    sendnotifications: true,
    sendlatenotifications: true,
    sendstudentnotifications: true,
    duedate: Math.floor(Date.now() / 1000) + 1209600, // 2 weeks from now
    allowsubmissionsfromdate: Math.floor(Date.now() / 1000),
    grade: 100,
    timemodified: Math.floor(Date.now() / 1000),
    completionsubmit: true,
    cutoffdate: Math.floor(Date.now() / 1000) + 1814400, // 3 weeks from now
    gradingduedate: Math.floor(Date.now() / 1000) + 2419200, // 4 weeks from now
    teamsubmission: false,
    requireallteammemberssubmit: false,
    teamsubmissiongroupingid: 0,
    blindmarking: false,
    hidegrader: false,
    revealidentities: false,
    attemptreopenmethod: 'manual',
    maxattempts: 5,
    markingworkflow: false,
    markingallocation: false,
    requiresubmissionstatement: true,
    preventsubmissionnotingroup: false
  },
  {
    id: 3,
    course: 3,
    name: 'Database Schema Design',
    intro: 'Design a complete database schema for an e-commerce system. Include tables, relationships, indexes, and sample queries.',
    introformat: 1,
    alwaysshowdescription: true,
    nosubmissions: false,
    submissiondrafts: false,
    sendnotifications: true,
    sendlatenotifications: true,
    sendstudentnotifications: true,
    duedate: Math.floor(Date.now() / 1000) - 86400, // Overdue (1 day ago)
    allowsubmissionsfromdate: Math.floor(Date.now() / 1000) - 1209600, // 2 weeks ago
    grade: 100,
    timemodified: Math.floor(Date.now() / 1000),
    completionsubmit: true,
    cutoffdate: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
    gradingduedate: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
    teamsubmission: true,
    requireallteammemberssubmit: true,
    teamsubmissiongroupingid: 1,
    blindmarking: false,
    hidegrader: false,
    revealidentities: false,
    attemptreopenmethod: 'manual',
    maxattempts: 2,
    markingworkflow: true,
    markingallocation: false,
    requiresubmissionstatement: false,
    preventsubmissionnotingroup: true
  }
]

export const demoSearchResults: MoodleSearchResult[] = [
  {
    areaid: 'mod_resource',
    courseid: 1,
    title: 'HTML Basics Tutorial',
    content: 'Learn the fundamentals of HTML including tags, attributes, and semantic markup. This comprehensive guide covers everything you need to know.',
    contextid: 101,
    type: 'resource',
    url: '#'
  },
  {
    areaid: 'mod_forum',
    courseid: 1,
    title: 'CSS Grid vs Flexbox Discussion',
    content: 'Community discussion about when to use CSS Grid versus Flexbox for layout. Multiple perspectives and real-world examples.',
    contextid: 102,
    type: 'forum',
    url: '#'
  },
  {
    areaid: 'mod_video',
    courseid: 2,
    title: 'React Hooks Introduction Video',
    content: 'Video tutorial explaining useState, useEffect, and custom hooks with practical examples and common patterns.',
    contextid: 201,
    type: 'video',
    url: '#'
  },
  {
    areaid: 'mod_quiz',
    courseid: 3,
    title: 'SQL Joins Practice Quiz',
    content: 'Test your knowledge of SQL joins including INNER, LEFT, RIGHT, and FULL OUTER joins with practical scenarios.',
    contextid: 301,
    type: 'quiz',
    url: '#'
  }
]

// Demo mode configuration
export const DEMO_CONFIG = {
  baseUrl: 'https://demo.moodle.localhost',
  token: 'demo_token_for_testing_12345678901234567890',
  enabled: true
}