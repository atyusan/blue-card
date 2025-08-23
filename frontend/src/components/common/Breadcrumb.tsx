import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs as MuiBreadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';
import { NAVIGATION_ITEMS } from '../../constants';
import type { NavigationItem } from '../../types';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();

  // Generate breadcrumb items based on current location
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always add home
    breadcrumbs.push({
      label: 'Home',
      path: '/dashboard',
      isActive: false,
    });

    if (pathSegments.length === 0) {
      return breadcrumbs;
    }

    let currentPath = '';
    const navigationMap = new Map<string, NavigationItem>();

    // Build navigation map for easy lookup
    const buildNavigationMap = (items: NavigationItem[]) => {
      items.forEach((item) => {
        navigationMap.set(item.path, item);
        if (item.children) {
          buildNavigationMap(item.children);
        }
      });
    };
    buildNavigationMap(NAVIGATION_ITEMS);

    // Generate breadcrumbs based on path segments
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const navigationItem = navigationMap.get(currentPath);

      if (navigationItem) {
        breadcrumbs.push({
          label: navigationItem.label,
          path: currentPath,
          isActive: index === pathSegments.length - 1,
        });
      } else {
        // Handle dynamic segments (like IDs)
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: currentPath,
          isActive: index === pathSegments.length - 1,
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumbs for home page
  }

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize='small' />}
        aria-label='breadcrumb'
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary',
          },
        }}
      >
        {breadcrumbItems.map((item, index) => {
          if (item.isActive) {
            return (
              <Typography
                key={item.path}
                color='text.primary'
                sx={{ fontWeight: 500 }}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <MuiLink
              key={item.path}
              component={Link}
              to={item.path}
              color='text.secondary'
              sx={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {index === 0 && <Home sx={{ fontSize: 16 }} />}
              {item.label}
            </MuiLink>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumb;
