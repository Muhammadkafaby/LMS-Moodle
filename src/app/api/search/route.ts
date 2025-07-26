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
    const query = searchParams.get('q') || ''
    const courseId = searchParams.get('courseId')

    const connection = await getConnection()
    
    let sql = `
      SELECT 
        c.id,
        c.title,
        c.content_type,
        c.content_url,
        c.content_text,
        c.created_at,
        co.fullname as course_name,
        co.shortname as course_shortname
      FROM contents c
      JOIN courses co ON c.course_id = co.id
      WHERE (c.title LIKE ? OR c.content_text LIKE ?)
    `
    
    let params = [`%${query}%`, `%${query}%`]
    
    if (courseId) {
      sql += ' AND c.course_id = ?'
      params.push(courseId)
    }
    
    sql += ' ORDER BY c.created_at DESC LIMIT 50'

    const [results] = await connection.execute(sql, params)

    await connection.end()

    return NextResponse.json({
      success: true,
      results: results,
      query: query,
      message: 'Search completed'
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}