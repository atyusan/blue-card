import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { treatmentService } from '@/services/treatment.service';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  PersonAdd,
  Description,
  CalendarToday,
  Settings,
  Security,
  Business,
  CreditCard,
  TrendingUp,
  Logout,
  VpnKey,
  BarChart,
  ListAlt,
  Layers,
  ExpandLess,
  ExpandMore,
  Schedule,
  EventBusy,
  LocalHospital,
  Science,
  Biotech,
  Assignment,
  Assessment,
} from '@mui/icons-material';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  // Main Dashboard
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Dashboard,
    permission: null,
  },

  // Core Management
  {
    title: 'Core Management',
    icon: People,
    permission: 'view_patients',
    children: [
      {
        title: 'Patients',
        href: '/patients',
        icon: People,
        permission: 'view_patients',
      },
      {
        title: 'Staff',
        href: '/staff',
        icon: PersonAdd,
        permission: 'view_staff',
      },
      {
        title: 'Appointments',
        href: '/appointments',
        icon: CalendarToday,
        permission: 'view_appointments',
      },
      {
        title: 'Treatments',
        href: '/treatments',
        icon: LocalHospital,
        permission: 'view_treatments',
      },
      {
        title: 'My Availability',
        href: '/provider/availability',
        icon: Schedule,
        permission: 'view_appointments',
      },
      {
        title: 'Time Off Management',
        href: '/timeoff-management',
        icon: EventBusy,
        permission: 'admin',
      },
    ],
  },

  // Laboratory
  {
    title: 'Laboratory',
    icon: Science,
    permission: 'view_lab_requests',
    children: [
      {
        title: 'Lab Requests Pool',
        href: '/lab/requests-pool',
        icon: Assignment,
        permission: 'process_lab_tests',
      },
      {
        title: 'Lab Test Pool',
        href: '/lab/test-pool',
        icon: Biotech,
        permission: 'process_lab_tests',
      },
      {
        title: 'Lab Orders',
        href: '/lab/orders',
        icon: ListAlt,
        permission: 'view_lab_orders',
      },
      {
        title: 'Lab Results',
        href: '/lab/results',
        icon: Assessment,
        permission: 'view_lab_results',
      },
      {
        title: 'Lab Tests',
        href: '/lab/tests',
        icon: Biotech,
        permission: 'view_lab_tests',
      },
    ],
  },

  // Administrative
  {
    title: 'Administrative',
    icon: Business,
    permission: 'view_departments',
    children: [
      {
        title: 'Departments',
        href: '/departments',
        icon: Business,
        permission: 'view_departments',
      },
      {
        title: 'Services',
        href: '/services',
        icon: Description,
        permission: 'view_services',
      },
      {
        title: 'Roles',
        href: '/roles',
        icon: VpnKey,
        permission: 'view_roles',
      },
    ],
  },

  // Financial
  {
    title: 'Financial',
    icon: CreditCard,
    permission: 'view_billing',
    children: [
      {
        title: 'Billing',
        href: '/billing',
        icon: CreditCard,
        permission: 'view_billing',
      },
      {
        title: 'Cash Management',
        href: '/cash',
        icon: TrendingUp,
        permission: 'view_cash_transactions',
      },
    ],
  },

  // Permission System
  {
    title: 'Permissions',
    icon: Security,
    permission: null,
    children: [
      {
        title: 'My Permissions',
        href: '/permissions',
        icon: Security,
        permission: null,
      },
      {
        title: 'Permission Templates',
        href: '/permission-templates',
        icon: Layers,
        permission: 'view_permission_templates',
      },
      {
        title: 'Temporary Permissions',
        href: '/temporary-permissions',
        icon: ListAlt,
        permission: 'view_temporary_permissions',
      },
      {
        title: 'Permission Workflows',
        href: '/permission-workflows',
        icon: ListAlt,
        permission: 'view_permission_workflows',
      },
    ],
  },

  // Admin & Analytics
  {
    title: 'Admin & Analytics',
    icon: BarChart,
    permission: 'manage_permissions',
    children: [
      {
        title: 'Permission Management',
        href: '/admin/permissions',
        icon: Security,
        permission: 'manage_permissions',
      },
      {
        title: 'Permission Analytics',
        href: '/admin/analytics',
        icon: BarChart,
        permission: 'view_permission_analytics',
      },
    ],
  },

  // Settings
  {
    title: 'Settings',
    icon: Settings,
    permission: 'manage_system_settings',
    children: [
      {
        title: 'System Settings',
        href: '/settings',
        icon: Settings,
        permission: 'manage_system_settings',
      },
      {
        title: 'Advanced Settings',
        href: '/system-settings',
        icon: Settings,
        permission: 'manage_system_settings',
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, staffMember, logout, hasPermission, isAdmin } = useAuth();
  const { canViewTreatments } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isAdminUser = isAdmin();

  // Fetch pending transfers count (only for non-admin providers)
  const { data: transferredData } = useQuery({
    queryKey: ['sidebar-transferred-count'],
    queryFn: () =>
      treatmentService.getTransferredTreatments({ acknowledged: false }),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    enabled: canViewTreatments() && !isAdminUser && !!staffMember,
  });

  const pendingTransfersCount = transferredData?.unacknowledged || 0;

  const handleLogout = () => {
    logout();
  };

  const toggleExpanded = (itemTitle: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemTitle)) {
      newExpanded.delete(itemTitle);
    } else {
      newExpanded.add(itemTitle);
    }
    setExpandedItems(newExpanded);
  };

  const isItemActive = (item: any): boolean => {
    if (item.href) {
      return location.pathname === item.href;
    }
    if (item.children) {
      return item.children.some(
        (child: any) => location.pathname === child.href
      );
    }
    return false;
  };

  const shouldShowItem = (item: any): boolean => {
    if (!item.permission) return true;
    return hasPermission(item.permission) || isAdmin();
  };

  const filteredNavigationItems = navigationItems.filter(shouldShowItem);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant='h6'
              sx={{ color: 'white', fontWeight: 'bold' }}
            >
              BC
            </Typography>
          </Box>
          <Box>
            <Typography
              variant='h6'
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              Blue Card
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Hospital Management
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List component='nav' sx={{ px: 1, py: 2 }}>
          {filteredNavigationItems.map((item) => {
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.has(item.title);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <React.Fragment key={item.title}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (hasChildren) {
                        toggleExpanded(item.title);
                      } else if (item.href) {
                        // Close mobile sidebar when clicking a link
                        if (window.innerWidth < 1024) {
                          onToggle();
                        }
                      }
                    }}
                    selected={isActive && !hasChildren}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      minHeight: 48,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.50',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.100',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: 2,
                        justifyContent: 'center',
                        color: isActive ? 'primary.main' : 'inherit',
                      }}
                    >
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        item.title === 'Treatments' &&
                        !isAdminUser &&
                        pendingTransfersCount > 0 ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {item.title}
                            <Chip
                              label={pendingTransfersCount}
                              size='small'
                              color='warning'
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}
                            />
                          </Box>
                        ) : (
                          item.title
                        )
                      }
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: isActive ? 600 : 400,
                        },
                      }}
                    />
                    {hasChildren && (
                      <IconButton size='small' sx={{ ml: 1 }}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                  </ListItemButton>
                </ListItem>

                {/* Children */}
                {hasChildren && (
                  <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                    <List component='div' disablePadding>
                      {item.children
                        ?.filter((child) => shouldShowItem(child))
                        .map((child) => {
                          const isChildActive =
                            location.pathname === child.href;
                          return (
                            <ListItem key={child.href} disablePadding>
                              <ListItemButton
                                component={Link}
                                to={child.href}
                                selected={isChildActive}
                                onClick={() => {
                                  // Close mobile sidebar when clicking a link
                                  if (window.innerWidth < 1024) {
                                    onToggle();
                                  }
                                }}
                                sx={{
                                  borderRadius: 1,
                                  mx: 1,
                                  mb: 0.5,
                                  pl: 4,
                                  minHeight: 40,
                                  '&.Mui-selected': {
                                    backgroundColor: 'primary.50',
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'primary.100',
                                    },
                                  },
                                  '&:hover': {
                                    backgroundColor: 'grey.100',
                                  },
                                }}
                              >
                                <ListItemIcon
                                  sx={{
                                    minWidth: 0,
                                    mr: 2,
                                    justifyContent: 'center',
                                    color: isChildActive
                                      ? 'primary.main'
                                      : 'inherit',
                                  }}
                                >
                                  <child.icon />
                                </ListItemIcon>
                                <ListItemText
                                  primary={child.title}
                                  sx={{
                                    '& .MuiTypography-root': {
                                      fontWeight: isChildActive ? 600 : 400,
                                      fontSize: '0.875rem',
                                    },
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* User Profile & Logout */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'grey.100',
            },
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              fontSize: '16px',
            }}
          >
            {user?.firstName?.charAt(0) || 'U'}
            {user?.lastName?.charAt(0) || ''}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant='body2'
              sx={{ fontWeight: 500, color: 'text.primary' }}
              noWrap
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label='Admin'
                size='small'
                sx={{
                  height: 20,
                  fontSize: '11px',
                  backgroundColor: 'primary.100',
                  color: 'primary.main',
                }}
              />
            </Box>
          </Box>
        </Box>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mt: 1,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.50',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: 2, color: 'error.main' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary='Logout' />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant='temporary'
        open={isOpen}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant='permanent'
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
};
