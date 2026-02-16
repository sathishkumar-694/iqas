# IT Quality Assurance System (IQAS)

## Overview
A MERN stack application for managing QA processes, including issue tracking, user roles (Admin, Dev, Tester), and project management.

## Tech Stack
-   **Client:** React (Vite), Bootstrap, Axios
-   **Server:** Node.js, Express, MongoDB (Mongoose), JWT Auth

## Project Structure
-   `/client`: Frontend React application.
-   `/server`: Backend Node/Express API.

## Prerequisites
-   Node.js (v18+)
-   MongoDB (Running locally on default port 27017 or Cloud Atlas)

## Getting Started

### 1. Setup Backend
```bash
cd server
npm install
# Create a .env file based on the example below
npm start
```
Server runs on `http://localhost:5000`.

### 2. Setup Frontend
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

### 3. Environment Variables (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/iqas
JWT_SECRET=your_super_secret_key_change_me
```
