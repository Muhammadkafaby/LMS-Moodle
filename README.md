# Moodle Integration App

A modern web application that integrates with Moodle through its REST API, providing a clean interface for course management, assignment submission, and content search.

## 🚀 Features

- **Authentication**: Secure login using Moodle API tokens
- **Course Dashboard**: View and manage enrolled courses
- **Assignment Upload**: Submit assignments with file uploads and text submissions
- **Content Search**: Search across courses for learning materials
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Dynamic data fetching with caching
- **File Management**: Support for multiple file types and drag-and-drop uploads

## 🛠 Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Query for server state
- **Authentication**: Custom Moodle API integration
- **TypeScript**: Full type safety
- **Deployment**: Docker & Docker Compose ready

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Moodle Instance**: Access to a Moodle site with web services enabled
2. **API Token**: A valid Moodle web service token
3. **Development Environment**: Node.js 18+ or Docker
4. **Permissions**: Appropriate Moodle permissions for web service access

### Moodle Configuration

Your Moodle administrator needs to:

1. Enable web services (`Site administration → Advanced features → Enable web services`)
2. Enable REST protocol (`Site administration → Plugins → Web services → Manage protocols`)
3. Create a web service (`Site administration → Plugins → Web services → External services`)
4. Add required functions to the service:
   - `core_webservice_get_site_info`
   - `core_enrol_get_users_courses`
   - `core_course_get_contents`
   - `mod_assign_get_assignments`
   - `mod_assign_save_submission`
   - `core_search_get_results`
   - `core_course_get_courses_by_field`

5. Authorize users and generate tokens

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd LMS-Moodle
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Moodle configuration:
   ```env
   MOODLE_BASE_URL=https://your-moodle-instance.com
   MOODLE_WS_TOKEN=your_webservice_token_here
   NEXTAUTH_SECRET=your_random_secret_here
   ```

3. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   Open http://localhost:3000 in your browser

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open http://localhost:3000 in your browser

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MOODLE_BASE_URL` | Your Moodle instance URL | Yes | - |
| `MOODLE_WS_TOKEN` | Web service token | Yes | - |
| `NEXTAUTH_SECRET` | Secret for session encryption | Yes | - |
| `NEXTAUTH_URL` | Application URL | No | http://localhost:3000 |
| `MAX_FILE_SIZE` | Maximum upload file size | No | 50MB |
| `ALLOWED_FILE_TYPES` | Allowed file extensions | No | pdf,doc,docx,txt,zip,jpg,png |

### Getting Your Moodle Token

1. **Log in to your Moodle site**
2. **Navigate to**: User menu → Preferences → User account → Security keys
3. **Create a new token** or copy an existing web service token
4. **Use this token** in your `.env.local` file

## 📱 Usage

### Login
1. Enter your Moodle site URL (e.g., `https://moodle.yourschool.edu`)
2. Enter your web service token
3. Click "Connect to Moodle"

### Course Management
- View all your enrolled courses
- See course progress and completion status
- Select courses for targeted operations

### Assignment Submission
1. Select a course from the sidebar
2. Navigate to "Assignments" tab
3. Choose an assignment from the list
4. Upload files via drag-and-drop or file browser
5. Add optional submission text
6. Submit your assignment

### Content Search
1. Use the global search to find content across all courses
2. Or select a specific course for targeted search
3. Search results show relevant materials with highlighting
4. Click links to view content in Moodle

## 🐳 Docker Deployment

### Production Deployment

1. **Prepare environment**:
   ```bash
   cp .env.example .env.local
   # Configure production values
   ```

2. **Build and deploy**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **With Nginx (optional)**:
   ```bash
   docker-compose --profile production up -d
   ```

### Environment-specific Deployments

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔍 API Reference

The application uses the following Moodle Web Service functions:

### Core Functions
- `core_webservice_get_site_info` - Get site information and user details
- `core_enrol_get_users_courses` - Get user's enrolled courses
- `core_course_get_contents` - Get course content structure

### Assignment Functions
- `mod_assign_get_assignments` - Get assignments for courses
- `mod_assign_save_submission` - Submit assignment files and text
- `mod_assign_get_submission_status` - Check submission status

### Search Functions
- `core_search_get_results` - Global content search
- Course content fallback search for sites without global search

### File Upload
- `/webservice/upload.php` - Upload files to Moodle

## 🛠 Development

### Project Structure
```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard layout
│   ├── courses/        # Course management
│   ├── assignments/    # Assignment handling
│   ├── search/         # Search functionality
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── lib/                # Utilities and API client
└── types/              # TypeScript definitions
```

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- React Query for state management

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid token" error**:
   - Verify your token is correct and active
   - Check that web services are enabled in Moodle
   - Ensure the token has required capabilities

2. **CORS errors**:
   - Moodle must allow your domain in CORS settings
   - Check `$CFG->allowedorigins` in Moodle config

3. **File upload fails**:
   - Check Moodle file size limits
   - Verify upload permissions
   - Ensure file types are allowed

4. **Search not working**:
   - Global search may not be enabled
   - Falls back to course content search
   - Select a specific course for better results

### Debug Mode

Set `NODE_ENV=development` to enable:
- Detailed error messages
- API request logging
- Development tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the [troubleshooting](#troubleshooting) section
- Review Moodle's [Web Services documentation](https://docs.moodle.org/dev/Web_services)
- Open an issue in this repository

## 🔮 Future Enhancements

- Grade viewing and management
- Calendar integration
- Notification system
- Mobile app version
- Advanced search filters
- Bulk file operations
- Offline mode support

---

**Note**: This application is designed to work with Moodle's official REST API and does not reimplement LMS functionality. It serves as a modern interface layer over existing Moodle features.