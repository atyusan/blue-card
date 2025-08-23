import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon as MenuItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  MedicalServices,
  Receipt,
  Event,
  Payment,
  Assessment,
  Settings,
  AccountCircle,
  Logout,
  Notifications,
  Search,
  ExpandMore,
  Home,
  Person,
  LocalHospital,
  BusinessCenter,
  Timeline,
  Security,
  LocalPharmacy,
  Biotech,
  LocalHospitalOutlined,
  Hotel,
  AccountBalance,
  ManageAccounts,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { NAVIGATION_ITEMS } from '../../constants';
import type { NavigationItem } from '../../types';

const DRAWER_WIDTH = 280;
const MOBILE_DRAWER_WIDTH = 320;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Check if navigation item is active
  const isActive = (item: NavigationItem): boolean => {
    if (item.path === location.pathname) return true;
    if (item.children) {
      return item.children.some(
        (child: NavigationItem) => child.path === location.pathname
      );
    }
    return false;
  };

  // Check if navigation item should be expanded
  const shouldExpand = (item: NavigationItem): boolean => {
    if (!item.children) return false;
    return item.children.some(
      (child: NavigationItem) => child.path === location.pathname
    );
  };

  // Toggle expanded state for navigation item
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Handle drawer toggle for mobile
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle user menu
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isItemActive = isActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const shouldBeExpanded = shouldExpand(item);

    // Auto-expand if item should be expanded
    if (shouldBeExpanded && !isExpanded) {
      setExpandedItems((prev) => new Set(prev).add(item.id));
    }

    return (
      <React.Fragment key={item.id}>
        <ListItem
          disablePadding
          sx={{
            pl: level * 2 + 2,
            '& .MuiListItemButton-root': {
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
            },
          }}
        >
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              } else {
                handleNavigation(item.path);
              }
            }}
            selected={isItemActive}
            sx={{
              minHeight: 48,
              justifyContent: level === 0 ? 'initial' : 'flex-start',
              px: 2,
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
                mr: level === 0 ? 2 : 1,
                justifyContent: 'center',
                color: isItemActive ? 'primary.main' : 'inherit',
              }}
            >
              {getNavigationIcon(item.icon)}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isItemActive ? 600 : 400,
                },
              }}
            />
            {hasChildren && (
              <IconButton
                size='small'
                sx={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <ExpandMore />
              </IconButton>
            )}
          </ListItemButton>
        </ListItem>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <List component='div' disablePadding>
            {item.children!.map((child: NavigationItem) =>
              renderNavigationItem(child, level + 1)
            )}
          </List>
        )}
      </React.Fragment>
    );
  };

  // Get navigation icon based on icon name
  const getNavigationIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      Dashboard: <Dashboard />,
      People: <People />,
      MedicalServices: <MedicalServices />,
      Receipt: <Receipt />,
      Event: <Event />,
      Payment: <Payment />,
      Assessment: <Assessment />,
      Settings: <Settings />,
      Home: <Home />,
      Person: <Person />,
      LocalHospital: <LocalHospital />,
      BusinessCenter: <BusinessCenter />,
      Timeline: <Timeline />,
      Security: <Security />,
      LocalPharmacy: <LocalPharmacy />,
      Biotech: <Biotech />,
      LocalHospitalOutlined: <LocalHospitalOutlined />,
      Hotel: <Hotel />,
      AccountBalance: <AccountBalance />,
      ManageAccounts: <ManageAccounts />,
      Notifications: <Notifications />,
    };
    return iconMap[iconName] || <Dashboard />;
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = NAVIGATION_ITEMS.find(
      (item) =>
        item.path === location.pathname ||
        item.children?.some(
          (child: NavigationItem) => child.path === location.pathname
        )
    );
    return currentItem?.label || 'Dashboard';
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (!user?.role) return '';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand Section */}
      <Box
        sx={{
          p: 3,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalHospital sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography
              variant='h6'
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              Caresync Hospital
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Management System
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'grey.100',
            borderRadius: 2,
            px: 2,
            py: 1,
          }}
        >
          <Search sx={{ fontSize: 20, color: 'grey.500', mr: 1 }} />
          <input
            type='text'
            placeholder='Search...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              flex: 1,
              fontSize: '14px',
            }}
          />
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List component='nav' sx={{ px: 1 }}>
          {NAVIGATION_ITEMS.map((item) => renderNavigationItem(item))}
        </List>
      </Box>

      {/* User Profile Section */}
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
          onClick={handleUserMenuOpen}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              fontSize: '16px',
            }}
          >
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
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
                label={getUserRoleDisplay()}
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
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position='fixed'
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color='inherit'
            aria-label='open drawer'
            edge='start'
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant='h6'
            component='div'
            sx={{ flex: 1, fontWeight: 600 }}
          >
            {getCurrentPageTitle()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Search Button for Mobile */}
            <IconButton
              color='inherit'
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <Search />
            </IconButton>

            {/* Notifications */}
            <Tooltip title='Notifications'>
              <IconButton color='inherit' size='small'>
                <Badge badgeContent={3} color='error'>
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Tooltip title='User menu'>
              <IconButton
                onClick={handleUserMenuOpen}
                color='inherit'
                size='small'
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component='nav'
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant='temporary'
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: MOBILE_DRAWER_WIDTH,
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
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: 'grey.50',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <MenuItemIcon>
            <AccountCircle fontSize='small' />
          </MenuItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <MenuItemIcon>
            <Logout fontSize='small' />
          </MenuItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
