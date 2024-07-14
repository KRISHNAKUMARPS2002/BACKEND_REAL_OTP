# Hotel Booking Application

This is a hotel booking application with a Node.js backend and a Flutter frontend. The backend is deployed on an AWS EC2 instance with Nginx as a reverse proxy. The backend includes routes for users, admins, and workers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Environment Variables](#environment-variables)
4. [Running the Project](#running-the-project)
5. [API Endpoints](#api-endpoints)
6. [Testing with Postman](#testing-with-postman)
7. [Deployment](#deployment)

## Prerequisites

- Node.js installed
- MongoDB URI
- AWS account for deployment
- Postman for API testing

## Project Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/hotel-booking-app.git
    cd hotel-booking-app
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables (see [Environment Variables](#environment-variables)).

## Environment Variables

Create a `.env` file in the root of the project and add the following:

    ```env
    NODE_ENV=production
    PORT=3000
    MONGODB_URI=mongodb://your-mongo-uri
    ```

## Running the Project

To start the server, run:

    ```bash
    npm start
    ```

The application will run on `http://localhost:3000`.

## API Endpoints

### User Routes

- `POST /api/user/register` - Register a new user
    ```json
    {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    ```

- `POST /api/user/verify-otp` - Verify OTP
    ```json
    {
        "otp": "123456"
    }
    ```

- `POST /api/user/login` - User login
    ```json
    {
        "email": "test@example.com",
        "password": "password123"
    }
    ```

- `GET /api/user/profile` - Get user profile (protected)
    - Headers: `Authorization: Bearer <token>`

- `PUT /api/user/update` - Update user details (protected)
    - Headers: `Authorization: Bearer <token>`
    ```json
    {
        "username": "newusername",
        "email": "newemail@example.com"
    }
    ```

- `DELETE /api/user/delete` - Delete a user (protected)
    - Headers: `Authorization: Bearer <token>`

- `POST /api/user/verify-bluetick` - Verify user blue tick (protected)
    - Headers: `Authorization: Bearer <token>`

- `POST /api/user/checkin-details` - Add user check-in details (protected)
    - Headers: `Authorization: Bearer <token>`
    ```json
    {
        "checkinDetails": "details"
    }
    ```

- `GET /api/user/loyalty-status` - Check loyalty status (protected)
    - Headers: `Authorization: Bearer <token>`

- `POST /api/user/favorites/:authId` - Add a favorite (protected)
    - Headers: `Authorization: Bearer <token>`
    ```json
    {
        "hotelId": "hotel-id-123"
    }
    ```

- `GET /api/user/favorites/:authId` - Get favorites by authenticated user (protected)
    - Headers: `Authorization: Bearer <token>`

- `PUT /api/user/favorites/:authId/:index` - Update favorite by index (protected)
    - Headers: `Authorization: Bearer <token>`
    ```json
    {
        "hotelId": "updated-hotel-id-123"
    }
    ```

- `DELETE /api/user/favorites/:authId/:index` - Remove favorite by index (protected)
    - Headers: `Authorization: Bearer <token>`

- `POST /api/user/upload-photo` - Upload user photo (protected)
    - Headers: `Authorization: Bearer <token>`
    - Body (Form-Data):
        - `photo`: [Upload an image file]

### Admin Routes

- `POST /api/admin/register` - Register a new admin
    ```json
    {
        "username": "adminuser",
        "email": "admin@example.com",
        "password": "adminpassword123"
    }
    ```

- `POST /api/admin/verify-otp` - Verify OTP during registration
    ```json
    {
        "otp": "123456"
    }
    ```

- `POST /api/admin/login` - Admin login
    ```json
    {
        "email": "admin@example.com",
        "password": "adminpassword123"
    }
    ```

- `GET /api/admin/profile` - Get admin profile (protected)
    - Headers: `Authorization: Bearer <token>`

- `PUT /api/admin/update` - Update admin details (protected)
    - Headers: `Authorization: Bearer <token>`
    ```json
    {
        "username": "newadminuser",
        "email": "newadmin@example.com"
    }
    ```

- `DELETE /api/admin/delete` - Delete an admin (protected)
    - Headers: `Authorization: Bearer <token>`

- `POST /api/admin/hotels` - Create a new hotel (protected)
    - Headers: `Authorization: Bearer <token>`
    - Body (Form-Data):
        - `name`: `Test Hotel`
        - `location`: `Test Location`
        - `image`: [Upload an image file]

- `PUT /api/admin/hotels/:id` - Update hotel details (protected)
    - Headers: `Authorization: Bearer <token>`
    - Body (Form-Data):
        - `name`: `Updated Hotel Name`
        - `location`: `Updated Location`
        - `image`: [Upload an image file]

- `DELETE /api/admin/hotels/:id` - Delete a hotel (protected)
    - Headers: `Authorization: Bearer <token>`

### Worker Routes

- `POST /api/worker/register` - Register a new worker
    ```json
    {
        "username": "workeruser",
        "email": "worker@example.com",
        "password": "workerpassword123"
    }
    ```

- `POST /api/worker/login` - Worker login
    ```json
    {
        "email": "worker@example.com",
        "password": "workerpassword123"
    }
    ```

- `POST /api/worker/getByCredentials` - Get worker by credentials (protected)
    - Headers: `Authorization: Bearer <token>`
    ```json
    {
        "username": "workeruser",
        "password": "workerpassword123"
    }
    ```

## Testing with Postman

1. **Set Base URL**: The base URL for your API is `http://13.233.156.216:3000`.

2. **Register a New User**:
    - Method: `POST`
    - URL: `http://13.233.156.216:3000/api/user/register`
    - Body (JSON):
        ```json
        {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        ```

3. **User Login**:
    - Method: `POST`
    - URL: `http://13.233.156.216:3000/api/user/login`
    - Body (JSON):
        ```json
        {
            "email": "test@example.com",
            "password": "password123"
        }
        ```

4. **Register a New Admin**:
    - Method: `POST`
    - URL: `http://13.233.156.216:3000/api/admin/register`
    - Body (JSON):
        ```json
        {
            "username": "adminuser",
            "email": "admin@example.com",
            "password": "adminpassword123"
        }
        ```

5. **Admin Login**:
    - Method: `POST`
    - URL: `http://13.233.156.216:3000/api/admin/login`
    - Body (JSON):
        ```json
        {
            "email": "admin@example.com",
            "password": "adminpassword123"
        }
        ```

6. **Access Protected Routes**:
    - Include the JWT token received after login in the `Authorization` header as `Bearer <token>`.

7. **Create a New Hotel**:
    - Method: `POST`
    - URL: `http://13.233.156.216:3000/api/admin/hotels`
    - Headers:
        - `Authorization`: `Bearer <token>`
    - Body (Form-Data):
        - `name`: `Test Hotel`
        - `location`: `Test Location`
        - `image`: [Upload an image file]

For more detailed API documentation, refer to the code and comments in the respective route files.

## Deployment

The backend is deployed on an AWS EC2 instance. Follow these steps for deployment:

1. **SSH into EC2 Instance**:
    ```bash
    ssh -i your-key.pem ec2-user@your-ec2-ip-address
    ```

2. **Install Node.js and Nginx on EC2**:
    ```bash
    sudo yum update -y
    sudo yum install -y nodejs npm nginx
    ```

3. **Clone the Repository on EC2**:
    ```bash
    git clone https://github.com/your-username/hotel-booking-app.git
    cd hotel-booking-app
    ```

4. **Install Dependencies**:
    ```bash
    npm install
    ```

5. **Set Up Environment Variables**:
    ```bash
    nano .env
    # Add your environment variables
    ```

6. **Start the Server**:
    ```bash
    npm start
    ```

7. **Configure Nginx**:
    ```bash
    sudo nano /etc/nginx/nginx.conf
    # Update the server block to reverse proxy to your Node.js app
    ```

8. **Restart Nginx**:
    ```bash
    sudo systemctl restart nginx
    ```

Your application should now be accessible at `http://your-ec2-ip-address`.


