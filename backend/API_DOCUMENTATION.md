# Brain Tumor Classification API Documentation

## Base URL
```
http://localhost:8080/api
```

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Endpoints Check](#endpoints-check)
  - [Scan Records](#scan-records)
- [Data Models](#data-models)
- [Testing Guide](#testing-guide)
- [Coming Soon](#coming-soon)

## Overview

This API provides endpoints for managing brain tumor MRI scan records, including creating, retrieving, and deleting scan information. Currently, this API is in MVP phase and will be enhanced with additional features in upcoming sprints.

## Authentication

Currently, no authentication is required for API access (will be implemented in future phases).

## Error Handling

All responses follow standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 204 | Deleted successfully (no content returned) |
| 400 | Bad Request - Invalid input or missing required fields |
| 404 | Not Found - The requested resource does not exist |
| 500 | Server Error - Something went wrong on the server |

## Endpoints

### Endpoints Check

#### GET /mri-scans
Check if the backend server is running.

**Response Example:**
```json
{
  "status": "Backend is running!"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/test
```

**Postman Instructions:**
1. Select **GET** method
2. Enter URL: `http://localhost:8080/api/test`
3. Click **Send**

### Scan Records

#### GET /scans
Retrieve all scan records.

**Response Example:**
```json
[
  {
    "_id": "65d4e8a2f3c12345678901a",
    "patientId": "PAT001",
    "patientName": "John Doe",
    "scanDate": "2025-02-20T14:35:12.326Z",
    "status": "pending",
    "createdAt": "2025-02-20T14:35:12.326Z",
    "updatedAt": "2025-02-20T14:35:12.326Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/scans
```

#### GET /scans/:id
Retrieve a single scan by ID.

**Response Example:**
```json
{
  "_id": "65d4e8a2f3c12345678901a",
  "patientId": "PAT001",
  "patientName": "John Doe",
  "scanDate": "2025-02-20T14:35:12.326Z",
  "status": "pending",
  "createdAt": "2025-02-20T14:35:12.326Z",
  "updatedAt": "2025-02-20T14:35:12.326Z"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/scans/65d4e8a2f3c12345678901a
```

#### POST /scans
Create a new scan record.

**Request Body:**
```json
{
  "patientId": "PAT003",
  "patientName": "Alice Johnson"
}
```

**Response Example (201):**
```json
{
  "_id": "65d4e8a2f3c12345678901c",
  "patientId": "PAT003",
  "patientName": "Alice Johnson",
  "scanDate": "2025-02-20T15:42:18.123Z",
  "status": "pending",
  "createdAt": "2025-02-20T15:42:18.123Z",
  "updatedAt": "2025-02-20T15:42:18.123Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/scans \
-H "Content-Type: application/json" \
-d '{"patientId": "PAT003", "patientName": "Alice Johnson"}'
```

#### POST /scans/sample/create
Create sample scan data for testing.

**Response Example (201):**
```json
{
  "message": "Sample data added",
  "count": 2
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/scans/sample/create
