# Brain Tumor Classification System - Backend

A robust backend system for brain tumor classification using machine learning and medical imaging analysis.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Google OAuth integration
  - Role-based access control (Admin, Doctor, Researcher)
  - Password reset functionality

- **Patient Management**
  - CRUD operations for patient records
  - Medical history tracking
  - Doctor assignment
  - Patient notes and annotations

- **Scan Management**
  - MRI scan upload and storage
  - Scan status tracking
  - Batch processing support
  - Image annotations

- **Report Generation**
  - PDF report generation
  - Comprehensive medical reports
  - Customizable report templates
  - Report history tracking

- **Security Features**
  - Rate limiting
  - Input validation
  - XSS protection
  - MongoDB sanitization
  - Helmet.js security headers
  - CORS configuration

- **Logging & Monitoring**
  - Winston logger integration
  - Request/response logging
  - Error tracking
  - Audit logging

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (for job queue)
- Google OAuth credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd brain-tumor-classification/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/brain-tumor-db
JWT_SECRET=your-jwt-secret
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

4. Create required directories:
```bash
mkdir uploads reports logs
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Running Tests
```bash
npm test
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Linting
```bash
npm run lint
npm run lint:fix     # Fix linting issues
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PATCH /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `POST /api/patients/:id/medical-history` - Add medical history
- `POST /api/patients/:id/notes` - Add patient note
- `POST /api/patients/:id/assign-doctor` - Assign doctor to patient

### Scans
- `GET /api/scans` - Get all scans
- `GET /api/scans/:id` - Get scan by ID
- `POST /api/scans` - Upload new scan
- `PATCH /api/scans/:id` - Update scan
- `DELETE /api/scans/:id` - Delete scan
- `POST /api/scans/:id/annotate` - Add scan annotation
- `POST /api/scans/:id/report` - Generate scan report
- `GET /api/scans/statistics` - Get scan statistics

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:
```json
{
    "error": "Error message",
    "details": "Additional error details (in development mode)"
}
```

## Security Considerations

- All endpoints (except login/register) require authentication
- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Rate limiting is applied to prevent abuse
- Input validation is performed on all requests
- MongoDB queries are sanitized to prevent injection
- XSS protection is enabled
- CORS is configured for specific origins

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 