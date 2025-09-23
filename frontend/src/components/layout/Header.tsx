import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Box,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Notifications,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleUserMenuClose();
    navigate('/settings');
  };

  // Get page title from current path
  const getPageTitle = () => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(Boolean);

    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      return 'Dashboard';
    }

    // Capitalize first segment and replace hyphens with spaces
    const title = pathSegments[0]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return title;
  };

  return (
    <AppBar
      position='static'
      elevation={1}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        {/* Mobile menu button */}
        <IconButton
          color='inherit'
          aria-label='open drawer'
          edge='start'
          onClick={onToggleSidebar}
          sx={{ mr: 2, display: { lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Page Title */}
        <Typography
          variant='h6'
          component='div'
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          {getPageTitle()}
        </Typography>

        {/* Header Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '14px',
                }}
              >
                {user?.firstName?.charAt(0) || 'U'}
                {user?.lastName?.charAt(0) || ''}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          onClick={handleUserMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 200,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant='subtitle2' noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant='body2' color='text.secondary' noWrap>
              {user?.email}
            </Typography>
          </Box>

          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <AccountCircle fontSize='small' />
            </ListItemIcon>
            Profile
          </MenuItem>

          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <Settings fontSize='small' />
            </ListItemIcon>
            Settings
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize='small' />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
