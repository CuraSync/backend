# Curasync Backend

## Overview

Curasync is a comprehensive healthcare platform that connects patients, doctors, pharmacies, and laboratories in a unified digital ecosystem. This repository contains the backend API that powers the Curasync application, built with Node.js and Express.js.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Session Store**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.io
- **File Storage**: Cloudinary
- **Security**: bcrypt.js for password hashing, ChaCha20 encryption for messages

## Key Features
- Multi-role Authentication: Secure login system for doctors, patients, pharmacies, and laboratories
- Refresh Token System: Enhanced security with access and refresh tokens
- Real-time Messaging: WebSocket-based chat functionality between all user types
- Timeline System: Medical history and notes sharing
- Request Management: Connection requests between different entities
- File Upload/Download: Lab report management with Cloudinary integration
- Data Visualization: Integration with visualization services for lab report analysis

## API Structure
The API is structured around four main user roles:

- Doctor: User management, patient interactions, messaging
- Patient: Profile management, doctor/lab/pharmacy interactions
- Pharmacy: Medication management, patient communication
- Laboratory: Test results management, patient interactions

Main API Endpoints
- Authentication: `/login`, `/refresh`, `/logout`
- Doctor routes: `/doctor/*`
- Patient routes: `/patient/*`
- Pharmacy routes: `/pharmacy/*`
- Laboratory routes: `/laboratory/*`
- Lab reports: `/labreport/*`

## WebSocket Integration
Real-time communication is implemented using Socket.io with two namespaces:

- `/chat` - For direct messaging between users
- `/timeline` - For timeline updates

## License