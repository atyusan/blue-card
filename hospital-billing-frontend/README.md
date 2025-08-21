# Hospital Billing System - Frontend

A modern, responsive frontend application for the Hospital Billing System built with React, TypeScript, Vite, Tailwind CSS, and Material-UI.

## 🚀 Features

- **Modern React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Material-UI (MUI)** for beautiful, accessible components
- **React Router v6** for client-side routing
- **React Query** for server state management
- **React Hook Form** with Zod validation
- **Responsive design** with mobile-first approach
- **Authentication system** with JWT tokens
- **Role-based access control** (RBAC)
- **Protected routes** and navigation guards

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Material-UI
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Material-UI Icons
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Common components (ProtectedRoute, etc.)
│   ├── layout/         # Layout components (Layout, Sidebar, etc.)
│   ├── forms/          # Form components
│   └── ui/             # UI components
├── pages/              # Page components
├── hooks/              # Custom hooks
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Application constants
├── styles/             # Global styles
└── context/            # React contexts (Auth, etc.)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hospital-billing-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   VITE_APP_ENVIRONMENT=development
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔐 Authentication

The application includes a complete authentication system:

- **Login/Logout** functionality
- **JWT token** management
- **Protected routes** with automatic redirects
- **Role-based access control** (RBAC)
- **Token refresh** mechanism
- **Session persistence** across browser refreshes

### Demo Credentials

For testing purposes, you can use these demo credentials:

- **Email**: admin@hospital.com
- **Password**: admin123

## 🎨 UI Components

### Material-UI Integration

The application uses Material-UI components with a custom theme that integrates seamlessly with Tailwind CSS:

- **Custom color palette** matching Tailwind colors
- **Responsive breakpoints** for mobile-first design
- **Custom component styles** for consistent branding
- **Dark mode support** (coming soon)

### Tailwind CSS Utilities

Custom Tailwind classes are available for common patterns:

- `.btn-primary` - Primary button styles
- `.btn-secondary` - Secondary button styles
- `.card` - Card container styles
- `.input-field` - Form input styles
- `.sidebar-item` - Sidebar navigation styles

## 📱 Responsive Design

The application is fully responsive with:

- **Mobile-first** approach
- **Collapsible sidebar** on mobile devices
- **Touch-friendly** interactions
- **Optimized layouts** for all screen sizes
- **Progressive enhancement** for better user experience

## 🔒 Security Features

- **JWT token** authentication
- **Automatic token refresh**
- **Protected API endpoints**
- **Role-based permissions**
- **Secure route guards**
- **XSS protection** with proper input sanitization

## 🚧 Development Guidelines

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** rules and **Prettier** formatting
- Use **functional components** with hooks
- Implement **proper error handling**
- Write **meaningful component names**

### Component Structure

```typescript
import React from 'react';
import { ComponentProps } from './types';

interface ComponentNameProps {
  // Props interface
}

const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  // Component logic

  return (
    // JSX
  );
};

export default ComponentName;
```

### State Management

- Use **React Query** for server state
- Use **Context API** for global application state
- Use **local state** for component-specific state
- Implement **proper loading states**

## 🧪 Testing

Testing setup includes:

- **Unit testing** with Vitest
- **Component testing** with React Testing Library
- **E2E testing** with Playwright (coming soon)
- **Accessibility testing** with axe-core

## 📦 Building for Production

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Preview the build**

   ```bash
   npm run preview
   ```

3. **Deploy the `dist` folder** to your hosting service

## 🔧 Configuration

### Environment Variables

| Variable               | Description              | Default                        |
| ---------------------- | ------------------------ | ------------------------------ |
| `VITE_API_BASE_URL`    | Backend API base URL     | `http://localhost:3000/api/v1` |
| `VITE_API_TIMEOUT`     | API request timeout (ms) | `30000`                        |
| `VITE_APP_NAME`        | Application name         | `Hospital Billing System`      |
| `VITE_APP_ENVIRONMENT` | Environment (dev/prod)   | `development`                  |

### Tailwind Configuration

The Tailwind configuration includes:

- **Custom color palette** matching the design system
- **Custom spacing** and **typography** scales
- **Custom animations** and **transitions**
- **Component-specific** utility classes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Roadmap

### Phase 2: Core Features

- [ ] Patient management system
- [ ] Appointment scheduling
- [ ] Service catalog management
- [ ] Invoice creation and management

### Phase 3: Advanced Features

- [ ] Payment processing integration
- [ ] Reporting and analytics
- [ ] User management and permissions
- [ ] Audit logging

### Phase 4: Enhancements

- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] Export functionality (PDF, Excel)

---

**Happy Coding! 🎉**
