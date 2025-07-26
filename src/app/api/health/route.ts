import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Basic health checks
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    }

    // Check environment variables
    const requiredEnvVars = ['MOODLE_BASE_URL', 'NEXTAUTH_SECRET']
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        ...checks,
        status: 'unhealthy',
        errors: [`Missing environment variables: ${missingEnvVars.join(', ')}`]
      }, { status: 503 })
    }

    // Check Moodle connectivity (optional, can be slow)
    let moodleStatus = 'unknown'
    if (request.nextUrl.searchParams.get('full') === 'true') {
      try {
        const moodleResponse = await fetch(
          `${process.env.MOODLE_BASE_URL}/webservice/rest/server.php?wstoken=${process.env.MOODLE_WS_TOKEN}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`,
          { 
            method: 'GET',
            headers: { 'User-Agent': 'Moodle-Integration-App/1.0' },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          }
        )
        moodleStatus = moodleResponse.ok ? 'connected' : 'error'
      } catch (error) {
        moodleStatus = 'unreachable'
      }
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      ...checks,
      moodle: moodleStatus,
      responseTime: `${responseTime}ms`,
      endpoints: {
        health: '/api/health',
        'health-full': '/api/health?full=true',
        metrics: '/api/metrics'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}