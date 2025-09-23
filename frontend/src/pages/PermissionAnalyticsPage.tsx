import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography, Box } from '@mui/material';
import { Chip } from '@/components/ui/badge';
import { Tabs, Tab } from '@/components/ui/tabs';
import { People, Security, TrendingUp, Warning } from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionUsage {
  permission: string;
  totalUsage: number;
  roleBased: number;
  temporary: number;
  lastUsed: string;
}

interface RiskAssessment {
  permission: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
}

interface OptimizationSuggestion {
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  permissions: string[];
  recommendations: string[];
}

interface AnalyticsData {
  permissionUsage: PermissionUsage[];
  riskAssessment: RiskAssessment[];
  optimizationSuggestions: OptimizationSuggestion[];
  summary: {
    totalPermissions: number;
    activeUsers: number;
    highRiskPermissions: number;
    optimizationOpportunities: number;
  };
}

export const PermissionAnalyticsPage: React.FC = () => {
  const { canViewPermissionAnalytics } = usePermissions();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    permissionUsage: [],
    riskAssessment: [],
    optimizationSuggestions: [],
    summary: {
      totalPermissions: 0,
      activeUsers: 0,
      highRiskPermissions: 0,
      optimizationOpportunities: 0,
    },
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (canViewPermissionAnalytics()) {
      loadAnalytics();
    }
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch this from your API
      const mockAnalytics: AnalyticsData = {
        permissionUsage: [
          {
            permission: 'view_patients',
            totalUsage: 145,
            roleBased: 120,
            temporary: 25,
            lastUsed: '2024-01-20T10:30:00Z',
          },
          {
            permission: 'edit_patients',
            totalUsage: 89,
            roleBased: 75,
            temporary: 14,
            lastUsed: '2024-01-19T15:45:00Z',
          },
          {
            permission: 'manage_billing',
            totalUsage: 67,
            roleBased: 60,
            temporary: 7,
            lastUsed: '2024-01-18T09:15:00Z',
          },
          {
            permission: 'view_audit_logs',
            totalUsage: 23,
            roleBased: 20,
            temporary: 3,
            lastUsed: '2024-01-17T14:20:00Z',
          },
          {
            permission: 'perform_surgery',
            totalUsage: 12,
            roleBased: 10,
            temporary: 2,
            lastUsed: '2024-01-16T11:00:00Z',
          },
        ],
        riskAssessment: [
          {
            permission: 'perform_surgery',
            riskScore: 85,
            riskLevel: 'HIGH',
            riskFactors: [
              'Sensitive operation',
              'High privilege',
              'Rare usage',
            ],
          },
          {
            permission: 'view_audit_logs',
            riskScore: 72,
            riskLevel: 'MEDIUM',
            riskFactors: ['Sensitive data access', 'Compliance requirement'],
          },
          {
            permission: 'manage_billing',
            riskScore: 65,
            riskLevel: 'MEDIUM',
            riskFactors: ['Financial data', 'High usage'],
          },
          {
            permission: 'edit_patients',
            riskScore: 45,
            riskLevel: 'LOW',
            riskFactors: ['Regular operation', 'Supervised access'],
          },
          {
            permission: 'view_patients',
            riskScore: 25,
            riskLevel: 'LOW',
            riskFactors: ['Basic operation', 'High usage'],
          },
        ],
        optimizationSuggestions: [
          {
            description: 'Consolidate similar permissions',
            severity: 'MEDIUM',
            permissions: ['view_patients', 'view_patient_history'],
            recommendations: [
              'Merge view_patients and view_patient_history into a single permission',
              'Update role assignments to use the consolidated permission',
              'Monitor usage patterns after consolidation',
            ],
          },
          {
            description: 'Review high-risk permission assignments',
            severity: 'HIGH',
            permissions: ['perform_surgery', 'manage_system'],
            recommendations: [
              'Audit all users with perform_surgery permission',
              'Implement additional approval workflow for surgery permissions',
              'Consider time-limited assignments for critical permissions',
            ],
          },
          {
            description: 'Optimize role-based assignments',
            severity: 'LOW',
            permissions: ['view_patients', 'edit_patients'],
            recommendations: [
              'Review role definitions for redundant permissions',
              'Implement permission inheritance where appropriate',
              'Create department-specific role templates',
            ],
          },
        ],
        summary: {
          totalPermissions: 45,
          activeUsers: 127,
          highRiskPermissions: 8,
          optimizationOpportunities: 12,
        },
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canViewPermissionAnalytics()) {
    return (
      <div className='container mx-auto py-6 px-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='text-center text-red-600'>
              You don't have permission to view permission analytics.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='container mx-auto py-6 px-4'>
        <div className='text-center'>Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 px-4 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Permission Analytics</h1>
          <p className='text-muted-foreground'>
            Analyze permission usage, risk assessment, and optimization
            opportunities
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center space-x-2'>
              <Security sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant='h6' component='h3'>
                Total Permissions
              </Typography>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant='h4' component='p' className='font-bold'>
              {analytics.summary.totalPermissions}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Active permissions in system
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center space-x-2'>
              <People sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant='h6' component='h3'>
                Active Users
              </Typography>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant='h4' component='p' className='font-bold'>
              {analytics.summary.activeUsers}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Users with active permissions
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center space-x-2'>
              <Warning sx={{ fontSize: 20, color: 'warning.main' }} />
              <Typography variant='h6' component='h3'>
                High Risk
              </Typography>
            </div>
          </CardHeader>
          <CardContent>
            <Typography
              variant='h4'
              component='p'
              className='font-bold text-orange-600'
            >
              {analytics.summary.highRiskPermissions}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              High-risk permissions identified
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center space-x-2'>
              <TrendingUp sx={{ fontSize: 20, color: 'success.main' }} />
              <Typography variant='h6' component='h3'>
                Opportunities
              </Typography>
            </div>
          </CardHeader>
          <CardContent>
            <Typography
              variant='h4'
              component='p'
              className='font-bold text-green-600'
            >
              {analytics.summary.optimizationOpportunities}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Optimization opportunities found
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        className='space-y-4'
      >
        <Box className='grid w-full grid-cols-4'>
          <Tab value='overview' label='Overview' />
          <Tab value='usage' label='Usage' />
          <Tab value='risk' label='Risk Assessment' />
          <Tab value='optimization' label='Optimization' />
        </Box>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Box className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Permission Usage Summary */}
              <Card>
                <CardHeader>
                  <Typography variant='h6' component='h3'>
                    Permission Usage Summary
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {analytics.permissionUsage.slice(0, 5).map((usage) => (
                      <div
                        key={usage.permission}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div>
                          <p className='font-medium'>
                            {usage.permission.replace(/_/g, ' ')}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            Last used:{' '}
                            {new Date(usage.lastUsed).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <Chip label={usage.totalUsage} variant='outlined' />
                          <p className='text-xs text-muted-foreground mt-1'>
                            {usage.roleBased} role-based, {usage.temporary}{' '}
                            temporary
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Overview */}
              <Card>
                <CardHeader>
                  <Typography variant='h6' component='h3'>
                    Risk Overview
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {analytics.riskAssessment.slice(0, 5).map((risk) => (
                      <div
                        key={risk.permission}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div>
                          <p className='font-medium'>
                            {risk.permission.replace(/_/g, ' ')}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            Score: {risk.riskScore}/100
                          </p>
                        </div>
                        <Chip
                          label={risk.riskLevel}
                          className={getRiskLevelColor(risk.riskLevel)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Box>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <Box className='space-y-4'>
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3'>
                  Permission Usage Analytics
                </Typography>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.permissionUsage.map((usage) => (
                    <div
                      key={usage.permission}
                      className='border rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h3 className='font-medium'>
                          {usage.permission.replace(/_/g, ' ')}
                        </h3>
                        <Chip
                          label={`Total: ${usage.totalUsage}`}
                          variant='outlined'
                        />
                      </div>

                      <div className='grid grid-cols-3 gap-4 text-sm'>
                        <div className='text-center'>
                          <p className='text-muted-foreground'>Role-based</p>
                          <p className='font-medium text-green-600'>
                            {usage.roleBased}
                          </p>
                        </div>
                        <div className='text-center'>
                          <p className='text-muted-foreground'>Temporary</p>
                          <p className='font-medium text-orange-600'>
                            {usage.temporary}
                          </p>
                        </div>
                        <div className='text-center'>
                          <p className='text-muted-foreground'>Last Used</p>
                          <p className='font-medium'>
                            {new Date(usage.lastUsed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Risk Assessment Tab */}
        {activeTab === 'risk' && (
          <Box className='space-y-4'>
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3'>
                  Permission Risk Assessment
                </Typography>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.riskAssessment.map((risk) => (
                    <div
                      key={risk.permission}
                      className='border rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h3 className='font-medium'>
                          {risk.permission.replace(/_/g, ' ')}
                        </h3>
                        <div className='flex items-center space-x-2'>
                          <Chip
                            label={risk.riskLevel}
                            className={getRiskLevelColor(risk.riskLevel)}
                          />
                          <Chip
                            label={`Score: ${risk.riskScore}/100`}
                            variant='outlined'
                          />
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <p className='text-sm text-muted-foreground'>
                          Risk Factors:
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {risk.riskFactors.map((factor, index) => (
                            <Chip
                              key={index}
                              label={factor}
                              variant='outlined'
                              size='small'
                              className='text-xs'
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Optimization Tab */}
        {activeTab === 'optimization' && (
          <Box className='space-y-4'>
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3'>
                  Optimization Suggestions
                </Typography>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.optimizationSuggestions.map(
                    (suggestion, index) => (
                      <div key={index} className='border rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <h3 className='font-medium'>
                            {suggestion.description}
                          </h3>
                          <Chip
                            label={suggestion.severity}
                            className={getSeverityColor(suggestion.severity)}
                          />
                        </div>

                        <div className='space-y-3'>
                          <div>
                            <p className='text-sm text-muted-foreground mb-2'>
                              Affected Permissions:
                            </p>
                            <div className='flex flex-wrap gap-2'>
                              {suggestion.permissions.map((permission) => (
                                <Chip
                                  key={permission}
                                  label={permission.replace(/_/g, ' ')}
                                  variant='outlined'
                                  size='small'
                                  className='text-xs'
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className='text-sm text-muted-foreground mb-2'>
                              Recommendations:
                            </p>
                            <ul className='list-disc list-inside space-y-1 text-sm'>
                              {suggestion.recommendations.map(
                                (rec, recIndex) => (
                                  <li
                                    key={recIndex}
                                    className='text-muted-foreground'
                                  >
                                    {rec}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </Box>
        )}
      </Tabs>
    </div>
  );
};
