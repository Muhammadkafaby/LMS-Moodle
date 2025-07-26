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
    const userId = searchParams.get('userId') || '4' // Default to student1

    const connection = await getConnection()
    
    // Get user's enrolled courses
    const [courses] = await connection.execute(`
      SELECT 
        c.id,
        c.shortname,
        c.fullname,
        c.summary as description,
        'enrolled' as role,
        FROM_UNIXTIME(c.timecreated) as enrolled_at
      FROM mdl_course c
      WHERE c.visible = 1 AND c.id != 1
      ORDER BY c.fullname
    `, [])

    await connection.end()

    return NextResponse.json({
      success: true,
      courses: courses,
      message: 'Courses loaded from database'
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch courses',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}