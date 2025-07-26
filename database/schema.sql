-- Database schema for Moodle Integration App
-- This creates tables for direct database access

CREATE DATABASE IF NOT EXISTS moodle_app;
USE moodle_app;

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  fullname VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role ENUM('admin', 'teacher', 'student') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shortname VARCHAR(100) UNIQUE NOT NULL,
  fullname VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT DEFAULT 1,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Course enrollments
CREATE TABLE enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  role ENUM('teacher', 'student') DEFAULT 'student',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (user_id, course_id)
);

-- Assignments table
CREATE TABLE assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATETIME,
  max_grade DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Assignment submissions
CREATE TABLE submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  user_id INT NOT NULL,
  submission_text TEXT,
  file_path VARCHAR(500),
  grade DECIMAL(5,2),
  status ENUM('draft', 'submitted', 'graded') DEFAULT 'draft',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission (assignment_id, user_id)
);

-- Content/Resources table
CREATE TABLE contents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_type ENUM('file', 'url', 'text', 'video') NOT NULL,
  content_url VARCHAR(500),
  content_text TEXT,
  file_size INT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO users (username, email, fullname, role) VALUES
('admin', 'admin@localhost.com', 'System Administrator', 'admin'),
('teacher1', 'teacher1@localhost.com', 'John Smith', 'teacher'),
('teacher2', 'teacher2@localhost.com', 'Sarah Johnson', 'teacher'),
('student1', 'student1@localhost.com', 'Alice Brown', 'student'),
('student2', 'student2@localhost.com', 'Bob Wilson', 'student'),
('student3', 'student3@localhost.com', 'Carol Davis', 'student');

INSERT INTO courses (shortname, fullname, description) VALUES
('WEB101', 'Introduction to Web Development', 'Learn HTML, CSS, and JavaScript fundamentals'),
('DB201', 'Database Design and Management', 'Advanced database concepts and SQL'),
('API301', 'API Development with Node.js', 'Building RESTful APIs and microservices'),
('REACT401', 'Advanced React Development', 'State management, hooks, and performance optimization');

INSERT INTO enrollments (user_id, course_id, role) VALUES
(2, 1, 'teacher'), (2, 2, 'teacher'),
(3, 3, 'teacher'), (3, 4, 'teacher'),
(4, 1, 'student'), (4, 2, 'student'), (4, 3, 'student'),
(5, 1, 'student'), (5, 2, 'student'),
(6, 3, 'student'), (6, 4, 'student');

INSERT INTO assignments (course_id, name, description, due_date, max_grade) VALUES
(1, 'HTML Portfolio', 'Create a personal portfolio website using HTML and CSS', '2025-08-15 23:59:59', 100.00),
(1, 'JavaScript Calculator', 'Build a functional calculator using JavaScript', '2025-08-30 23:59:59', 100.00),
(2, 'Database Schema Design', 'Design a database schema for an e-commerce application', '2025-08-20 23:59:59', 100.00),
(3, 'REST API Project', 'Create a RESTful API for a task management system', '2025-09-10 23:59:59', 150.00),
(4, 'React Component Library', 'Build a reusable component library', '2025-09-20 23:59:59', 200.00);

INSERT INTO submissions (assignment_id, user_id, submission_text, status, grade) VALUES
(1, 4, 'Portfolio completed with responsive design and modern CSS features.', 'graded', 95.00),
(1, 5, 'Basic portfolio created with HTML and CSS.', 'graded', 78.00),
(2, 4, 'Calculator with advanced functions and error handling.', 'submitted', NULL),
(3, 4, 'E-commerce database with normalized tables and relationships.', 'graded', 88.00);

INSERT INTO contents (course_id, title, content_type, content_url, content_text) VALUES
(1, 'HTML Basics', 'text', NULL, 'Introduction to HTML tags and document structure'),
(1, 'CSS Fundamentals', 'url', 'https://example.com/css-guide', NULL),
(2, 'SQL Tutorial Video', 'video', 'https://example.com/sql-video', NULL),
(2, 'Database Normalization', 'text', NULL, 'Understanding 1NF, 2NF, and 3NF'),
(3, 'Node.js Documentation', 'url', 'https://nodejs.org/docs', NULL),
(4, 'React Hooks Guide', 'text', NULL, 'Complete guide to React hooks and state management');