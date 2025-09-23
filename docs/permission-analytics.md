# Permission Analytics System

## Overview

The Permission Analytics System provides comprehensive insights into permission usage, security patterns, and optimization opportunities across the Blue Card Hospital Management System. It enables administrators to make data-driven decisions about access control and identify potential security risks.

## Features

- **Usage Analytics**: Track permission usage patterns and trends
- **Security Risk Assessment**: Identify potential security vulnerabilities
- **Optimization Suggestions**: Recommend permission improvements
- **Department Analysis**: Analyze permissions across departments
- **User Behavior Insights**: Understand how permissions are used
- **Compliance Reporting**: Generate compliance and audit reports
- **Performance Metrics**: Monitor system performance impact

## Database Schema

### Permission Audit Model

```prisma
model PermissionAudit {
  id          String   @id @default(cuid())
  userId      String
  permission  String   // The permission being used
  action      String   // GRANT, REVOKE, USE, DENY
  resource    String?  // Resource being accessed
  timestamp   DateTime @default(now())
  ipAddress   String?  // IP address of the request
  userAgent   String?  // User agent string
  success     Boolean  // Whether the action was successful
  metadata    Json?    // Additional context data

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("permission_audits")
}
```

### Permission Security Model

```prisma
model PermissionSecurity {
  id          String   @id @default(cuid())
  permission  String   // The permission being analyzed
  riskLevel   String   // LOW, MEDIUM, HIGH, CRITICAL
  riskFactors Json     // Array of risk factors
  mitigation  String?  // Suggested mitigation strategies
  lastUpdated DateTime @updatedAt

  @@map("permission_security")
}
```

## Analytics Categories

### Usage Analytics

#### Permission Frequency

- Most used permissions
- Least used permissions
- Permission usage trends over time
- Peak usage periods

#### User Behavior

- Permission usage by user role
- Permission usage by department
- User permission patterns
- Unusual usage patterns

#### Resource Access

- Most accessed resources
- Resource access patterns
- Permission-resource relationships
- Access time patterns

### Security Analytics

#### Risk Assessment

- High-risk permissions
- Permission combinations
- Access violation patterns
- Suspicious activities

#### Compliance Monitoring

- Policy violations
- Audit trail completeness
- Permission lifecycle tracking
- Regulatory compliance

#### Threat Detection

- Unusual access patterns
- Failed permission attempts
- Permission escalation attempts
- Brute force attacks

## API Endpoints

### Analytics Data

- `GET /permission-analytics/usage` - Get usage analytics
- `GET /permission-analytics/security` - Get security analytics
- `GET /permission-analytics/departments` - Get department analytics
- `GET /permission-analytics/users` - Get user analytics

### Risk Assessment

- `GET /permission-analytics/risk-assessment` - Get risk assessment
- `GET /permission-analytics/risk-factors` - Get risk factors
- `POST /permission-analytics/risk-mitigation` - Update risk mitigation

### Optimization

- `GET /permission-analytics/optimization` - Get optimization suggestions
- `GET /permission-analytics/recommendations` - Get recommendations
- `POST /permission-analytics/apply-optimization` - Apply optimization

### Reporting

- `GET /permission-analytics/reports` - Generate reports
- `GET /permission-analytics/export` - Export analytics data
- `POST /permission-analytics/schedule-report` - Schedule recurring reports

## Usage Examples

### Getting Usage Analytics

```typescript
GET /permission-analytics/usage?period=30d&groupBy=permission

Response:
{
  "period": "30d",
  "totalRequests": 15420,
  "successfulRequests": 15180,
  "failedRequests": 240,
  "permissions": [
    {
      "permission": "view_patients",
      "usageCount": 5420,
      "successRate": 99.2,
      "avgResponseTime": 45,
      "trend": "increasing"
    },
    {
      "permission": "edit_patients",
      "usageCount": 2890,
      "successRate": 98.7,
      "avgResponseTime": 67,
      "trend": "stable"
    }
  ]
}
```

### Getting Security Risk Assessment

```typescript
GET /permission-analytics/risk-assessment

Response:
{
  "overallRisk": "MEDIUM",
  "highRiskPermissions": [
    {
      "permission": "admin_access",
      "riskLevel": "HIGH",
      "riskFactors": [
        "Broad access scope",
        "High usage frequency",
        "Multiple users have access"
      ],
      "mitigation": "Implement approval workflow, reduce scope"
    }
  ],
  "riskTrends": {
    "trend": "decreasing",
    "change": -15,
    "period": "30d"
  }
}
```

### Getting Optimization Suggestions

```typescript
GET /permission-analytics/optimization

Response:
{
  "suggestions": [
    {
      "type": "PERMISSION_CONSOLIDATION",
      "title": "Consolidate Similar Permissions",
      "description": "Combine view_patient_basic and view_patient_detailed into view_patients",
      "impact": "HIGH",
      "effort": "MEDIUM",
      "permissions": ["view_patient_basic", "view_patient_detailed"],
      "recommendation": "view_patients"
    },
    {
      "type": "ROLE_OPTIMIZATION",
      "title": "Optimize Role Permissions",
      "description": "Remove unused permissions from 'Staff Nurse' role",
      "impact": "MEDIUM",
      "effort": "LOW",
      "role": "Staff Nurse",
      "unusedPermissions": ["edit_lab_results", "approve_treatments"]
    }
  ]
}
```

## Frontend Components

### AnalyticsDashboard Component

```typescript
import { usePermissionAnalytics } from '../hooks/usePermissionAnalytics';
import { Chart } from 'react-chartjs-2';

function AnalyticsDashboard() {
  const { usageData, securityData, optimizationData, isLoading, error } =
    usePermissionAnalytics();

  if (isLoading) return <div>Loading analytics...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className='analytics-dashboard'>
      <div className='metrics-grid'>
        <MetricCard
          title='Total Requests'
          value={usageData.totalRequests}
          trend={usageData.trend}
        />
        <MetricCard
          title='Success Rate'
          value={`${usageData.successRate}%`}
          trend={usageData.successTrend}
        />
        <MetricCard
          title='Risk Level'
          value={securityData.overallRisk}
          status={securityData.riskStatus}
        />
      </div>

      <div className='charts-section'>
        <div className='chart-container'>
          <h3>Permission Usage Trends</h3>
          <Chart
            type='line'
            data={usageData.chartData}
            options={chartOptions}
          />
        </div>

        <div className='chart-container'>
          <h3>Department Distribution</h3>
          <Chart
            type='doughnut'
            data={usageData.departmentData}
            options={chartOptions}
          />
        </div>
      </div>

      <div className='optimization-section'>
        <h3>Optimization Suggestions</h3>
        <OptimizationList suggestions={optimizationData.suggestions} />
      </div>
    </div>
  );
}
```

### RiskAssessment Component

```typescript
import { usePermissionAnalytics } from '../hooks/usePermissionAnalytics';

function RiskAssessment() {
  const { securityData, updateRiskMitigation } = usePermissionAnalytics();

  const handleMitigationUpdate = async (permissionId, mitigation) => {
    try {
      await updateRiskMitigation(permissionId, mitigation);
    } catch (error) {
      console.error('Error updating mitigation:', error);
    }
  };

  return (
    <div className='risk-assessment'>
      <div className='risk-summary'>
        <h2>Security Risk Assessment</h2>
        <div className='risk-level'>
          <span
            className={`risk-badge ${securityData.overallRisk.toLowerCase()}`}
          >
            {securityData.overallRisk}
          </span>
          <span className='risk-trend'>
            {securityData.riskTrends.trend === 'decreasing' ? '↓' : '↑'}
            {securityData.riskTrends.change}%
          </span>
        </div>
      </div>

      <div className='high-risk-permissions'>
        <h3>High Risk Permissions</h3>
        {securityData.highRiskPermissions.map((permission) => (
          <RiskCard
            key={permission.permission}
            permission={permission}
            onUpdateMitigation={(mitigation) =>
              handleMitigationUpdate(permission.permission, mitigation)
            }
          />
        ))}
      </div>

      <div className='risk-factors'>
        <h3>Risk Factors</h3>
        <RiskFactorsList factors={securityData.riskFactors} />
      </div>
    </div>
  );
}
```

### OptimizationSuggestions Component

```typescript
import { usePermissionAnalytics } from '../hooks/usePermissionAnalytics';

function OptimizationSuggestions() {
  const { optimizationData, applyOptimization } = usePermissionAnalytics();

  const handleApplyOptimization = async (suggestionId) => {
    try {
      await applyOptimization(suggestionId);
    } catch (error) {
      console.error('Error applying optimization:', error);
    }
  };

  return (
    <div className='optimization-suggestions'>
      <h2>Optimization Suggestions</h2>

      <div className='suggestions-grid'>
        {optimizationData.suggestions.map((suggestion) => (
          <OptimizationCard
            key={suggestion.type + suggestion.title}
            suggestion={suggestion}
            onApply={() => handleApplyOptimization(suggestion.type)}
          />
        ))}
      </div>

      <div className='optimization-summary'>
        <h3>Summary</h3>
        <div className='summary-stats'>
          <div className='stat'>
            <span className='label'>Total Suggestions:</span>
            <span className='value'>{optimizationData.suggestions.length}</span>
          </div>
          <div className='stat'>
            <span className='label'>High Impact:</span>
            <span className='value'>
              {
                optimizationData.suggestions.filter((s) => s.impact === 'HIGH')
                  .length
              }
            </span>
          </div>
          <div className='stat'>
            <span className='label'>Low Effort:</span>
            <span className='value'>
              {
                optimizationData.suggestions.filter((s) => s.effort === 'LOW')
                  .length
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Hooks

### usePermissionAnalytics Hook

```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function usePermissionAnalytics() {
  const [usageData, setUsageData] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsageAnalytics = async (
    period = '30d',
    groupBy = 'permission'
  ) => {
    try {
      const response = await api.get(
        `/permission-analytics/usage?period=${period}&groupBy=${groupBy}`
      );
      setUsageData(response.data);
    } catch (err) {
      setError(err);
    }
  };

  const fetchSecurityAnalytics = async () => {
    try {
      const response = await api.get('/permission-analytics/security');
      setSecurityData(response.data);
    } catch (err) {
      setError(err);
    }
  };

  const fetchOptimizationData = async () => {
    try {
      const response = await api.get('/permission-analytics/optimization');
      setOptimizationData(response.data);
    } catch (err) {
      setError(err);
    }
  };

  const updateRiskMitigation = async (permissionId, mitigation) => {
    try {
      const response = await api.post('/permission-analytics/risk-mitigation', {
        permissionId,
        mitigation,
      });
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const applyOptimization = async (suggestionId) => {
    try {
      const response = await api.post(
        '/permission-analytics/apply-optimization',
        {
          suggestionId,
        }
      );
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const fetchAllAnalytics = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsageAnalytics(),
        fetchSecurityAnalytics(),
        fetchOptimizationData(),
      ]);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  return {
    usageData,
    securityData,
    optimizationData,
    isLoading,
    error,
    fetchUsageAnalytics,
    fetchSecurityAnalytics,
    fetchOptimizationData,
    updateRiskMitigation,
    applyOptimization,
    refetch: fetchAllAnalytics,
  };
}
```

## Business Logic

### Usage Analytics Logic

```typescript
async getUsageAnalytics(period: string, groupBy: string) {
  const startDate = this.getStartDate(period);

  // Get permission usage data
  const usageData = await this.prisma.permissionAudit.groupBy({
    by: [groupBy],
    where: {
      timestamp: { gte: startDate },
    },
    _count: {
      id: true,
    },
    _sum: {
      success: true,
    },
  });

  // Get response time data
  const responseTimeData = await this.prisma.permissionAudit.aggregate({
    where: {
      timestamp: { gte: startDate },
    },
    _avg: {
      responseTime: true,
    },
  });

  // Calculate trends
  const previousPeriodData = await this.getPreviousPeriodData(period, groupBy);
  const trends = this.calculateTrends(usageData, previousPeriodData);

  return {
    period,
    totalRequests: usageData.reduce((sum, item) => sum + item._count.id, 0),
    successfulRequests: usageData.reduce((sum, item) => sum + (item._sum.success || 0), 0),
    failedRequests: usageData.reduce((sum, item) => sum + (item._count.id - (item._sum.success || 0)), 0),
    avgResponseTime: responseTimeData._avg.responseTime || 0,
    trends,
    [groupBy]: usageData.map(item => ({
      [groupBy]: item[groupBy],
      usageCount: item._count.id,
      successRate: this.calculateSuccessRate(item._count.id, item._sum.success || 0),
      trend: trends[item[groupBy]] || 'stable'
    }))
  };
}
```

### Risk Assessment Logic

```typescript
async getSecurityRiskAssessment() {
  // Get permission usage patterns
  const permissionUsage = await this.prisma.permissionAudit.groupBy({
    by: ['permission'],
    _count: { id: true },
    _sum: { success: true },
  });

  // Get failed access attempts
  const failedAttempts = await this.prisma.permissionAudit.groupBy({
    by: ['permission'],
    where: { success: false },
    _count: { id: true },
  });

  // Calculate risk scores
  const riskScores = permissionUsage.map(usage => {
    const permission = usage.permission;
    const totalUsage = usage._count.id;
    const successCount = usage._sum.success || 0;
    const failureCount = totalUsage - successCount;

    const riskScore = this.calculateRiskScore({
      totalUsage,
      failureRate: failureCount / totalUsage,
      permissionScope: this.getPermissionScope(permission),
      userCount: this.getUserCountWithPermission(permission),
      lastUsed: this.getLastUsageDate(permission)
    });

    return {
      permission,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      riskFactors: this.identifyRiskFactors(usage, failedAttempts),
      mitigation: this.suggestMitigation(riskScore, usage)
    };
  });

  // Sort by risk score
  const sortedRisks = riskScores.sort((a, b) => b.riskScore - a.riskScore);

  const highRiskPermissions = sortedRisks.filter(risk => risk.riskLevel === 'HIGH');
  const overallRisk = this.calculateOverallRisk(sortedRisks);

  return {
    overallRisk,
    highRiskPermissions,
    riskTrends: await this.getRiskTrends(),
    riskFactors: this.aggregateRiskFactors(sortedRisks)
  };
}
```

### Optimization Logic

```typescript
async getOptimizationSuggestions() {
  const suggestions = [];

  // Permission consolidation suggestions
  const consolidationSuggestions = await this.getConsolidationSuggestions();
  suggestions.push(...consolidationSuggestions);

  // Role optimization suggestions
  const roleOptimizations = await this.getRoleOptimizations();
  suggestions.push(...roleOptimizations);

  // Permission scope suggestions
  const scopeSuggestions = await this.getScopeOptimizations();
  suggestions.push(...scopeSuggestions);

  // Unused permission suggestions
  const unusedSuggestions = await this.getUnusedPermissionSuggestions();
  suggestions.push(...unusedSuggestions);

  return {
    suggestions: suggestions.sort((a, b) => {
      // Sort by impact (HIGH > MEDIUM > LOW) then by effort (LOW > MEDIUM > HIGH)
      const impactOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const effortOrder = { LOW: 3, MEDIUM: 2, HIGH: 1 };

      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[b.impact] - impactOrder[a.impact];
      }
      return effortOrder[b.effort] - effortOrder[a.effort];
    })
  };
}

private async getConsolidationSuggestions() {
  const suggestions = [];

  // Find similar permissions that could be consolidated
  const permissionGroups = await this.groupSimilarPermissions();

  for (const group of permissionGroups) {
    if (group.permissions.length > 1) {
      suggestions.push({
        type: 'PERMISSION_CONSOLIDATION',
        title: `Consolidate ${group.permissions.length} Similar Permissions`,
        description: `Combine ${group.permissions.join(', ')} into a single permission`,
        impact: 'HIGH',
        effort: 'MEDIUM',
        permissions: group.permissions,
        recommendation: group.recommendedPermission,
        estimatedSavings: group.estimatedSavings
      });
    }
  }

  return suggestions;
}
```

## Monitoring and Reporting

### Real-time Monitoring

- **Live Dashboard**: Real-time permission usage monitoring
- **Alert System**: Notify administrators of security issues
- **Performance Metrics**: Track system performance impact
- **Usage Patterns**: Monitor unusual access patterns

### Scheduled Reports

- **Daily Reports**: Daily permission usage summary
- **Weekly Reports**: Weekly security risk assessment
- **Monthly Reports**: Monthly optimization recommendations
- **Custom Reports**: Configurable report schedules

### Export Capabilities

- **CSV Export**: Export analytics data for external analysis
- **PDF Reports**: Generate formatted reports for stakeholders
- **API Access**: Programmatic access to analytics data
- **Integration**: Connect with external monitoring tools

## Best Practices

### Analytics Implementation

1. **Data Collection**: Collect comprehensive audit data
2. **Performance Impact**: Minimize performance impact of analytics
3. **Data Retention**: Implement appropriate data retention policies
4. **Privacy Protection**: Ensure user privacy in analytics

### Security Considerations

1. **Access Control**: Limit analytics access to authorized users
2. **Data Protection**: Protect sensitive analytics data
3. **Audit Trail**: Maintain audit trail for analytics access
4. **Compliance**: Ensure analytics comply with regulations

## Future Enhancements

### Planned Features

1. **Machine Learning**: AI-powered risk assessment
2. **Predictive Analytics**: Predict future permission needs
3. **Advanced Visualization**: Enhanced charts and graphs
4. **Real-time Alerts**: Instant security notifications

### Extension Points

1. **Custom Metrics**: User-defined analytics metrics
2. **External Integrations**: Connect with security tools
3. **Advanced Reporting**: Custom report builders
4. **Mobile Analytics**: Mobile-friendly analytics interface
