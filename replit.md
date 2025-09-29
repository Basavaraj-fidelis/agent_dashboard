# Multi-Agent Monitoring Dashboard

## Overview

A enterprise-grade monitoring dashboard for managing Windows-based agent systems across distributed environments. The application provides real-time monitoring, system health tracking, and security oversight for remote agents deployed across multiple locations. Built with a modern tech stack featuring React frontend with TypeScript, Express.js backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **UI Library**: Shadcn/UI components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design system optimized for monitoring dashboards
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API structure with `/api` prefix routing
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **Development**: Hot reloading with tsx for seamless development experience

### Database Design
- **Primary Database**: PostgreSQL for reliable data persistence
- **Connection**: Neon serverless PostgreSQL with WebSocket support
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Current Schema**: User authentication table with extensible design for agent data

### Component Architecture
- **Design System**: Carbon Design System approach with enterprise monitoring focus
- **Color Scheme**: Dark mode primary for monitoring environments with light mode alternative
- **Component Library**: Comprehensive set of monitoring-specific components including DeviceCard, StatusIndicator, ProcessTable, SecurityOverview
- **Layout System**: Sidebar-based navigation with responsive grid layouts for device management

### Agent Integration Design
- **Agent Type**: Windows-based Python agents for system monitoring
- **Data Collection**: System info, process monitoring, security status, network analysis, installed applications
- **Communication**: Heartbeat-based connectivity with configurable intervals
- **Data Format**: JSON-structured reports with standardized schemas for consistent parsing

### Security & Monitoring Features
- **Real-time Status**: Online/offline/warning states with visual indicators
- **System Metrics**: CPU, memory, disk usage tracking with top process analysis
- **Security Monitoring**: Windows Defender status, firewall configuration, UAC settings, patch management
- **Network Analysis**: IP configuration, open port scanning, critical service monitoring
- **Application Tracking**: Installed software inventory with publisher filtering