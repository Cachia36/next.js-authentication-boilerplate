# Next.js Authentication Boilerplate

A modern, production-ready authentication boilerplate built with
**Next.js App Router**, designed to be reusable, secure, and easy to
extend for real-world applications.

## 🌐 Live Demo
https://next-js-authentication-boilerplate.vercel.app/

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Tests](https://img.shields.io/badge/tests-vitest-green)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

Next.js (App Router) • TypeScript • JWT • HTTP-only cookies • Zod •
Vitest • GitHub Actions • Tailwind • shadcn/ui

This project focuses on **clean architecture**, **security best
practices**, and **testability**, making it suitable both as a starting
point for new projects and as a portfolio showcase.

------------------------------------------------------------------------

## ✨ Features

-   Complete authentication flow (register, login, logout)
-   Secure password hashing
-   Access & refresh token strategy using HTTP-only cookies
-   Password reset with token expiration and rate limiting
-   Clean architecture with domain/services/repositories separation
-   Unit and integration tests
-   CI-ready via GitHub Actions
-   Designed as a reusable boilerplate for future projects

------------------------------------------------------------------------

## 🛠 Tech Stack

-   **Next.js (App Router)**
-   **TypeScript**
-   **Node.js**
-   **JWT (access & refresh tokens)**
-   **HTTP-only cookies**
-   **Zod (validation)**
-   **Vitest (testing)**
-   **GitHub Actions (CI)**
-   **Tailwind CSS**
-   **shadcn/ui**

------------------------------------------------------------------------

## 📁 Project Structure

    src/
    ├── app/
    │   └── api/
    │       └── auth/          # Authentication API routes
    │
    ├── lib/
    │   ├── auth/
    │   │   ├── domain/        # Business rules & validation
    │   │   ├── services/      # Auth services (JWT, hashing)
    │   │   └── repositories/  # Data access layer
    │
    │   ├── core/              # Errors, logging, rate limiting
    │   └── http/              # API helpers & middleware
    │
    ├── components/
    │   └── auth/              # Authentication UI components
    │
    └── tests/                 # Unit & integration tests

------------------------------------------------------------------------

## 🔒 Security Considerations

This project follows several security best practices:

-   Passwords are **never stored in plain text**
-   Tokens are stored in **HTTP-only cookies**
-   Refresh tokens prevent frequent re-authentication
-   Rate limiting protects sensitive endpoints
-   Sensitive user fields are removed from public responses
-   Centralised error handling

------------------------------------------------------------------------

## 🧪 Testing & CI

Testing is implemented using **Vitest**.

Test coverage includes: - Registration - Login - Password reset - Error
handling scenarios

CI pipeline: - Runs automatically on **push** - Executes test suite via
**GitHub Actions**

------------------------------------------------------------------------

## 🚀 Getting Started

### 1. Clone the repository

    git clone https://github.com/yourusername/nextjs-authentication-boilerplate.git
    cd nextjs-authentication-boilerplate

### 2. Install dependencies

    npm install

### 3. Create environment variables

Create a `.env.local` file in the root of the project.

Example:

    JWT_SECRET=your-secret
    MONGODB_URI=your-mongodb-connection
    SMTP_HOST=smtp.example.com
    SMTP_USER=username
    SMTP_PASS=password

------------------------------------------------------------------------

### 4. Start the development server

    npm run dev

Open:

    http://localhost:3000

------------------------------------------------------------------------

## 🧰 Scripts

    npm run dev      # start development server
    npm run build    # production build
    npm run start    # run production server
    npm run lint     # run eslint
    npm run test     # run test suite

------------------------------------------------------------------------

## 🚧 Purpose

This project serves as:

-   A reusable authentication boilerplate
-   A portfolio project demonstrating full-stack architecture
-   A foundation for future full-stack applications

------------------------------------------------------------------------

## 📄 License

MIT License

------------------------------------------------------------------------

## 👤 Author

Kyle Cachia
