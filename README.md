# Rabbit Mechanic Services

![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![GetX](https://img.shields.io/badge/GetX-008000?style=for-the-badge)

A comprehensive cross-platform ecosystem connecting vehicle owners with mechanics for streamlined vehicle maintenance, repair management, and service automation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Firebase Setup](#firebase-setup)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Overview

**Rabbit Mechanic Services** is a complete vehicle management ecosystem designed to bridge the gap between vehicle owners and mechanics. The platform offers:

- **For Owners**: Vehicle maintenance tracking, mechanic discovery, trip management, and automated service reminders
- **For Mechanics**: Job requests, offer management, profile maintenance, and client communication
- **For Teams**: Role-based access control and collaborative vehicle management

### 📊 Project Details

| Aspect                   | Details                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- |
| **Platform**             | Flutter (Android & iOS), Next.js (Web)                                          |
| **Backend**              | Firebase (Authentication, Firestore, Cloud Functions, Cloud Messaging, Storage) |
| **State Management**     | GetX                                                                            |
| **Development Duration** | 1 Year                                                                          |
| **Developer**            | Atul Tiwari                                                                     |
| **Architecture**         | Cross-platform with real-time synchronization                                   |

## ✨ Features

### 👥 User App (Owner Side)

#### 🔐 Authentication & Onboarding

- Splash screen and onboarding flow
- Login, signup, and password recovery
- Default role assignment as **Owner**

#### 👥 Role Management

- Create and assign team roles:
  - Co-Owner, Manager, Driver, Vendor, Accountant, Other Staff
- Vehicle assignment and access level control (Add/Edit/View permissions)

#### 🔧 Find Mechanic

- Select vehicle and required services (200+ service types)
- Add location with optional photos and descriptions
- Customizable search radius (5-200 km)
- Compare multiple mechanic offers (typically 10-15)
- Automated job cancellation after 5 minutes if unaccepted

#### 📋 Job Management

- **My Jobs**: Track current, completed, and cancelled jobs
- **History**: Auto-transfer of completed/cancelled jobs
- Real-time status updates

#### 🚗 Trip Management

- Create trips with route details (e.g., Delhi–Chandigarh)
- Track mileage and trip-based expenses:
  - Fuel, food, tires, repairs, tolls, etc.
- Comprehensive expense categorization

#### 💰 Financial Management

- Create checks for team members (salary, reimbursement)
- Financial tracking and reporting

#### 🚙 Vehicle Management

- Manual vehicle addition or bulk Excel import (20-30 vehicles)
- Role-based vehicle assignment
- Complete vehicle record management

#### 📊 Records Management

- Add, search, and update vehicle service records
- Fields include: service type, date, mileage, workshop, invoice details, amount, description
- Image upload support for invoices and documents
- Daily mileage updates via "Add Miles" feature
- **Automated service alerts** via Cloud Functions

### 🔧 Mechanic App

#### 🌐 Multi-language Support

- Account creation with language selection
- Support for English, Hindi, Punjabi, and other languages
- Language-based matching to avoid communication barriers

#### 📲 Job Requests

- Real-time notifications for nearby service requests
- Detailed job information:
  - Vehicle type and services required
  - Description and photos
  - Location and distance
  - User requirements

#### 💵 Offer Management

- Submit competitive price offers
- Multiple mechanics can bid on same job
- User selection based on price, ratings, and location

#### 🛠️ Job Execution

- Accept/reject assigned jobs
- Update job status (In Progress → Completed)
- Automatic history tracking
- Mutual rating system with users

### 💻 Web Dashboard (Next.js)

- Complete functionality mirroring User App
- Administrative dashboard for overview and analytics
- Advanced record management and reporting
- Secure Firebase Authentication

## 🛠 Technology Stack

### Frontend

| Platform         | Technology                 |
| ---------------- | -------------------------- |
| Mobile Apps      | Flutter (Dart)             |
| Web Dashboard    | Next.js (React)            |
| State Management | GetX                       |
| UI Framework     | Flutter Material/Cupertino |

### Backend & Infrastructure

| Service              | Technology               |
| -------------------- | ------------------------ |
| Authentication       | Firebase Auth            |
| Database             | Cloud Firestore (NoSQL)  |
| Serverless Functions | Firebase Cloud Functions |
| File Storage         | Firebase Cloud Storage   |
| Push Notifications   | Firebase Cloud Messaging |
| Scheduling           | Firebase Cron Jobs       |
| Hosting              | Firebase Hosting         |

## 🏗 System Architecture

┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ User App │ │ Mechanic App │ │ Web Dashboard │
│ (Flutter) │ │ (Flutter) │ │ (Next.js) │
└─────────────────┘ └──────────────────┘ └──────────────────┘
│ │ │
└────────────────────────┼────────────────────────┘
│
┌─────────────────────────────────┐
│ Firebase Backend │
├─────────────────────────────────┤
│ ┌─────────┬─────────┬────────┐ │
│ │ Auth │Firestore│Storage │ │
│ └─────────┴─────────┴────────┘ │
│ ┌─────────┬──────────────────┐ │
│ │Functions│ Messaging │ │
│ └─────────┴──────────────────┘ │
└─────────────────────────────────┘

### Data Flow Example

1. **User** submits service request via "Find Mechanic"
2. Request stored in **Firestore** and broadcast to nearby mechanics
3. **Mechanics** receive job notification → review details → submit price offer
4. **User** receives multiple offers → selects preferred mechanic
5. **Mechanic** accepts and completes job → status updates to History
6. **Firebase Functions** automate notifications, cancellations, and overdue checks

## ⚙️ Installation

### Prerequisites

- Flutter SDK (>=3.0.0)
- Node.js (>=16.0.0)
- Firebase CLI
- Google account for Firebase

### Mobile App Setup

```bash
# Clone the repository
git clone https://github.com/atultiwari7388/r_service_app.git
cd rabbit_service_d_app (App)
cd rabbit-web-app (Web)

# Install dependencies
flutter pub get

# Run the app
flutter run
```
