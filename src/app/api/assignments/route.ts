import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'mariadb',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'apppassword123',
    database: process.env.DB_NAME || 'moodle_app'
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId') || '4' // Default to student1

    if (!courseId) {
      return NextResponse.json({
        success: false,
        error: 'Course ID required'
      }, { status: 400 })
    }

    const connection = await getConnection()
    
    // Get assignments for the course
    const [assignments] = await connection.execute(`
      SELECT 
        a.id,
        a.name,
        a.intro as description,
        FROM_UNIXTIME(a.duedate) as due_date,
        a.grade as max_grade,
        FROM_UNIXTIME(a.timemodified) as created_at,
        NULL as submission_id,
        'not_submitted' as submission_status,
        NULL as grade,
        NULL as submitted_at,
        NULL as graded_at
      FROM mdl_assign a
      JOIN mdl_course_modules cm ON a.id = cm.instance 
      JOIN mdl_modules m ON cm.module = m.id AND m.name = 'assign'
      WHERE cm.course = ?
      ORDER BY a.duedate ASC
    `, [userId, courseId])

    await connection.end()

    return NextResponse.json({
      success: true,
      assignments: assignments,
      message: 'Assignments loaded from database'
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assignments',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, userId, submissionText, files } = await request.json()

    if (!assignmentId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Assignment ID and User ID required'
      }, { status: 400 })
    }

    const connection = await getConnection()
    
    // Insert or update submission
    await connection.execute(`
      INSERT INTO submissions (assignment_id, user_id, submission_text, status, submitted_at)
      VALUES (?, ?, ?, 'submitted', NOW())
      ON DUPLICATE KEY UPDATE
      submission_text = VALUES(submission_text),
      status = 'submitted',
      submitted_at = NOW()
    `, [assignmentId, userId, submissionText || ''])

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully'
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to submit assignment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}