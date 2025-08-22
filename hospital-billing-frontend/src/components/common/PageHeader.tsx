import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add,
  Refresh,
  Download,
  FilterList,
  ViewList,
  ViewModule,
  MoreVert,
  ArrowBack,
} from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  showActions?: boolean;
  onAdd?: () => void;
  onRefresh?: () => void;
  onDownload?: () => void;
  onFilter?: () => void;
  onBack?: () => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  showViewToggle?: boolean;
  status?: {
    label: string;
    color:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  showActions = true,
  onAdd,
  onRefresh,
  onDownload,
  onFilter,
  onBack,
  viewMode = 'list',
  onViewModeChange,
  showViewToggle = false,
  status,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {breadcrumbs}

      {/* Main Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            {onBack && (
              <Tooltip title='Go Back'>
                <IconButton
                  onClick={onBack}
                  sx={{
                    backgroundColor: 'grey.100',
                    '&:hover': { backgroundColor: 'grey.200' },
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
            )}
            <Typography
              variant='h4'
              component='h1'
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              {title}
            </Typography>
            {status && (
              <Chip
                label={status.label}
                color={status.color}
                size='small'
                sx={{ height: 24, fontSize: '12px' }}
              />
            )}
          </Box>
          {subtitle && (
            <Typography
              variant='body1'
              color='text.secondary'
              sx={{ maxWidth: 600 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        {showActions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* View Mode Toggle */}
            {showViewToggle && onViewModeChange && (
              <Box
                sx={{
                  display: 'flex',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Tooltip title='List View'>
                  <IconButton
                    size='small'
                    onClick={() => onViewModeChange('list')}
                    sx={{
                      borderRadius: 0,
                      borderRight: 1,
                      borderColor: 'divider',
                      backgroundColor:
                        viewMode === 'list' ? 'primary.50' : 'transparent',
                      color:
                        viewMode === 'list' ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        backgroundColor:
                          viewMode === 'list' ? 'primary.100' : 'grey.100',
                      },
                    }}
                  >
                    <ViewList fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Grid View'>
                  <IconButton
                    size='small'
                    onClick={() => onViewModeChange('grid')}
                    sx={{
                      borderRadius: 0,
                      backgroundColor:
                        viewMode === 'grid' ? 'primary.50' : 'transparent',
                      color:
                        viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        backgroundColor:
                          viewMode === 'grid' ? 'primary.100' : 'grey.100',
                      },
                    }}
                  >
                    <ViewModule fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Filter Button */}
            {onFilter && (
              <Tooltip title='Filter'>
                <IconButton
                  onClick={onFilter}
                  sx={{
                    backgroundColor: 'grey.100',
                    '&:hover': { backgroundColor: 'grey.200' },
                  }}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            )}

            {/* Download Button */}
            {onDownload && (
              <Tooltip title='Download'>
                <IconButton
                  onClick={onDownload}
                  sx={{
                    backgroundColor: 'grey.100',
                    '&:hover': { backgroundColor: 'grey.200' },
                  }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <Tooltip title='Refresh'>
                <IconButton
                  onClick={onRefresh}
                  sx={{
                    backgroundColor: 'grey.100',
                    '&:hover': { backgroundColor: 'grey.200' },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}

            {/* Add Button */}
            {onAdd && (
              <Button
                variant='contained'
                startIcon={<Add />}
                onClick={onAdd}
                sx={{ minWidth: 120 }}
              >
                Add New
              </Button>
            )}

            {/* Custom Actions */}
            {actions}

            {/* More Options */}
            <Tooltip title='More options'>
              <IconButton
                sx={{
                  backgroundColor: 'grey.100',
                  '&:hover': { backgroundColor: 'grey.200' },
                }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Divider */}
      <Divider sx={{ mb: 3 }} />
    </Box>
  );
};

export default PageHeader;
