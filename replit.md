# EuroAssist.ai

## Overview

EuroAssist.ai is a chat-based AI assistant application designed to help students find information about European universities. The application provides AI-powered responses about university rankings, fees, scholarships, admission requirements, and academic programs across Europe. Built as a full-stack TypeScript application, it features a React frontend with a Express.js backend, integrated with OpenAI's GPT-5 model for intelligent responses and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Vite**: Fast development server and build tool for optimal developer experience
- **UI Framework**: Shadcn/ui components built on top of Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom design system using CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript support
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage for persistent user sessions
- **Database Layer**: Drizzle ORM for type-safe database operations and schema management
- **API Design**: RESTful endpoints with consistent error handling and request/response logging

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless for scalable data storage
- **ORM**: Drizzle ORM with schema-first approach for type safety and migrations
- **Session Store**: PostgreSQL-backed session storage using connect-pg-simple
- **Database Schema**: Structured tables for users, chats, and messages with proper foreign key relationships

### Authentication and Authorization
- **Replit Auth**: OAuth-based authentication system with OpenID Connect
- **Session-based**: Server-side session management with secure cookies
- **Authorization Middleware**: Route protection ensuring authenticated access to chat features
- **User Management**: Automatic user creation and profile synchronization

### External Service Integrations
- **OpenAI API**: GPT-5 integration for AI-powered university guidance responses
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Services**: Authentication provider and development environment integration

### Key Design Decisions

**Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories for code organization and type sharing between frontend and backend.

**Type Safety**: End-to-end TypeScript with shared schemas using Drizzle-Zod for consistent data validation across client and server.

**Real-time Chat Interface**: Message-based conversation system with persistent chat history and AI response streaming capabilities.

**Responsive Design**: Mobile-first approach with collapsible sidebar and adaptive layouts using Tailwind CSS breakpoints.

**Error Handling**: Comprehensive error handling with user-friendly messages and proper HTTP status codes throughout the application stack.