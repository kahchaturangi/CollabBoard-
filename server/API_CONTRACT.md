# API Contract

## Authentication Endpoints

### 1. Register User
- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Access:** Public
- **Description:** Registers a new user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "_id": "60d0fe4f5311236168a109ca",
    "username": "john_doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "User already exists with that email"
  }
  ```

### 2. Login User
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Access:** Public
- **Description:** Authenticates user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "_id": "60d0fe4f5311236168a109ca",
    "username": "john_doe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

### 3. Get Current User (Protected)
- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Access:** Private (Requires Bearer Token)
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Returns data for the currently logged-in user.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d0fe4f5311236168a109ca",
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2021-06-21T17:51:11.967Z",
      "updatedAt": "2021-06-21T17:51:11.967Z",
      "__v": 0
    }
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "success": false,
    "message": "Not authorized, token failed"
  }
  ```
