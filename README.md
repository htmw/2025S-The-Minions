# ImageMedix - Brain Tumor Detection System

A web application for brain tumor detection and analysis using machine learning.

## Project Structure

- **Backend**: Node.js/Express API server
- **Frontend**: Next.js web application
- **ML Model**: Python Flask server for machine learning inference

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- MongoDB
- Redis (optional, for job queue)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values (Credentials file is inn our WhatsApp Group)

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd code/imagemedix
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in the required values (Credentials file is in our WhatsApp Group)

4. Start the development server:
   ```
   npm run dev
   ```

### ML Model Setup

1. Navigate to the ML model directory:
   ```
   cd code/"machine learning"/brain
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install flask flask-cors python-dotenv requests pillow
   ```

5. Start the ML model server:
   ```
   python app.py
   ```

## Environment Variables

For security reasons, we don't commit `.env` files to the repository. Instead, we provide example files as templates (`.env.example` and `.env.local.example`) with the required variables but without actual values.

To get the actual values for these variables, please check our WhatsApp group.

## Features

- User authentication (email/password and Google OAuth)
- Brain MRI scan upload and analysis
- Tumor detection and classification(Not Completed)
- Report generation(Using mock data)
- User dashboard

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
