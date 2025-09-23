# Permission Templates and Presets System

## Overview

The Permission Templates and Presets System provides standardized permission sets for common roles, enabling consistent access control across the Blue Card Hospital Management System.

## Features

- **Standardized Templates**: Pre-built permission sets for common roles
- **Custom Presets**: User-defined permission combinations
- **Bulk Role Creation**: Quickly create multiple roles using templates
- **Version Control**: Track template changes and updates
- **Validation Rules**: Ensure permission combinations follow security policies

## Database Schema

### Permission Template Model

```prisma
model PermissionTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  category    String   // MEDICAL, NURSING, ADMINISTRATIVE
  permissions Json     // Array of permission strings
  isSystem    Boolean  @default(false)
  version     String   @default("1.0.0")
  metadata    Json?    // Additional template information
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?

  createdByUser User? @relation("TemplateCreator", fields: [createdBy], references: [id])
}
```

### Permission Preset Model

```prisma
model PermissionPreset {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  templateId  String?  // Optional reference to base template
  permissions Json     // Array of permission strings
  category    String   // Inherited from template or custom
  isCustom    Boolean  @default(true)
  version     String   @default("1.0.0")
  metadata    Json?    // Custom preset metadata
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?

  template    PermissionTemplate? @relation(fields: [templateId], references: [id])
  createdByUser User? @relation("PresetCreator", fields: [createdBy], references: [id])
}
```

## Template Categories

### Medical Staff Templates

#### Junior Doctor

```json
{
  "name": "Junior Doctor",
  "category": "MEDICAL",
  "permissions": [
    "view_patients",
    "view_patient_history",
    "create_consultations",
    "edit_own_consultations",
    "view_lab_results",
    "view_medications",
    "request_lab_tests",
    "view_department_patients"
  ],
  "metadata": {
    "experienceLevel": "ENTRY",
    "supervisionRequired": true,
    "maxPatientsPerDay": 15
  }
}
```

#### Senior Doctor

```json
{
  "name": "Senior Doctor",
  "category": "MEDICAL",
  "permissions": [
    "view_patients",
    "edit_patients",
    "create_consultations",
    "edit_consultations",
    "delete_consultations",
    "view_lab_results",
    "edit_lab_results",
    "prescribe_medications",
    "approve_treatments",
    "manage_department_staff",
    "view_audit_logs"
  ],
  "metadata": {
    "experienceLevel": "SENIOR",
    "supervisionRequired": false,
    "maxPatientsPerDay": 25
  }
}
```

### Nursing Staff Templates

#### Staff Nurse

```json
{
  "name": "Staff Nurse",
  "category": "NURSING",
  "permissions": [
    "view_patients",
    "record_vital_signs",
    "update_patient_status",
    "view_medications",
    "administer_medications",
    "view_lab_results",
    "record_nursing_notes"
  ]
}
```

### Administrative Staff Templates

#### Receptionist

```json
{
  "name": "Receptionist",
  "category": "ADMINISTRATIVE",
  "permissions": [
    "view_patients",
    "create_patients",
    "edit_patient_basic_info",
    "schedule_appointments",
    "view_appointments",
    "process_payments"
  ]
}
```

## API Endpoints

### Template Management

- `GET /permission-templates` - List all templates
- `POST /permission-templates` - Create new template
- `GET /permission-templates/{id}` - Get template details
- `PUT /permission-templates/{id}` - Update template
- `DELETE /permission-templates/{id}` - Delete template
- `POST /permission-templates/{id}/clone` - Clone existing template

### Preset Management

- `GET /permission-presets` - List all presets
- `POST /permission-presets` - Create new preset
- `GET /permission-presets/{id}` - Get preset details
- `PUT /permission-presets/{id}` - Update preset
- `DELETE /permission-presets/{id}` - Delete preset
- `POST /permission-presets/{id}/apply` - Apply preset to role

## Usage Examples

### Creating a Template

```typescript
POST /permission-templates
{
  "name": "Cardiology Specialist",
  "description": "Specialized permissions for cardiology specialists",
  "category": "MEDICAL",
  "permissions": [
    "view_patients", "edit_patients", "create_consultations",
    "cardiology_procedures", "ecg_interpretation", "echocardiogram_analysis"
  ],
  "metadata": {
    "department": "cardiology",
    "specialization": "cardiology"
  }
}
```

### Creating a Preset from Template

```typescript
POST /permission-presets
{
  "name": "Cardiology Fellow",
  "description": "Modified cardiology specialist template for fellows",
  "templateId": "cardiology_specialist_template_id",
  "permissions": [
    "view_patients", "edit_patients", "create_consultations",
    "cardiology_procedures", "ecg_interpretation"
  ],
  "metadata": {
    "trainingLevel": "fellow",
    "supervisionRequired": true
  }
}
```

## Frontend Components

### TemplateList Component

```typescript
import { usePermissionTemplates } from '../hooks/usePermissionTemplates';

function TemplateList() {
  const { templates, isLoading, error, deleteTemplate } =
    usePermissionTemplates();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filteredTemplates =
    selectedCategory === 'ALL'
      ? templates
      : templates.filter((template) => template.category === selectedCategory);

  return (
    <div>
      <div className='filters'>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value='ALL'>All Categories</option>
          <option value='MEDICAL'>Medical</option>
          <option value='NURSING'>Nursing</option>
          <option value='ADMINISTRATIVE'>Administrative</option>
        </select>
      </div>

      <div className='templates-grid'>
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onDelete={() => deleteTemplate(template.id)}
            onClone={() => cloneTemplate(template.id)}
            onApply={() => applyTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### TemplateForm Component

```typescript
function TemplateForm({ template, onSubmit }) {
  const { createTemplate, updateTemplate } = usePermissionTemplates();
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'MEDICAL',
    permissions: template?.permissions || [],
    metadata: template?.metadata || {},
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (template) {
        await updateTemplate(template.id, formData);
      } else {
        await createTemplate(formData);
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name='name'
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder='Template Name'
        required
      />

      <select
        name='category'
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      >
        <option value='MEDICAL'>Medical</option>
        <option value='NURSING'>Nursing</option>
        <option value='ADMINISTRATIVE'>Administrative</option>
      </select>

      <PermissionSelector
        selectedPermissions={formData.permissions}
        onChange={(permissions) => setFormData({ ...formData, permissions })}
        category={formData.category}
      />

      <button type='submit'>{template ? 'Update' : 'Create'} Template</button>
    </form>
  );
}
```

## Hooks

### usePermissionTemplates Hook

```typescript
export function usePermissionTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/permission-templates');
      setTemplates(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (data) => {
    const response = await api.post('/permission-templates', data);
    setTemplates((prev) => [...prev, response.data]);
    return response.data;
  };

  const updateTemplate = async (id, data) => {
    const response = await api.put(`/permission-templates/${id}`, data);
    setTemplates((prev) =>
      prev.map((template) => (template.id === id ? response.data : template))
    );
    return response.data;
  };

  const deleteTemplate = async (id) => {
    await api.delete(`/permission-templates/${id}`);
    setTemplates((prev) => prev.filter((template) => template.id !== id));
  };

  const cloneTemplate = async (id) => {
    const response = await api.post(`/permission-templates/${id}/clone`);
    setTemplates((prev) => [...prev, response.data]);
    return response.data;
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    refetch: fetchTemplates,
  };
}
```

## Business Logic

### Template Application Logic

```typescript
async applyTemplateToRole(templateId: string, roleData: any, customizations?: any) {
  const template = await this.prisma.permissionTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new NotFoundException(`Template with ID ${templateId} not found`);
  }

  let finalPermissions = [...template.permissions];
  let finalMetadata = { ...template.metadata };

  // Apply customizations if provided
  if (customizations) {
    if (customizations.addPermissions) {
      finalPermissions = [...finalPermissions, ...customizations.addPermissions];
    }

    if (customizations.removePermissions) {
      finalPermissions = finalPermissions.filter(
        permission => !customizations.removePermissions.includes(permission)
      );
    }

    if (customizations.metadata) {
      finalMetadata = { ...finalMetadata, ...customizations.metadata };
    }
  }

  // Create role with template-based permissions
  const role = await this.prisma.role.create({
    data: {
      name: roleData.name,
      code: roleData.code,
      description: roleData.description || template.description,
      permissions: finalPermissions,
      metadata: finalMetadata,
    },
  });

  return role;
}
```

## Best Practices

### Template Design

1. **Consistency**: Use consistent permission naming across templates
2. **Granularity**: Provide fine-grained permission control
3. **Documentation**: Document the purpose and usage of each template
4. **Validation**: Validate permission combinations for security

### Security Considerations

1. **Least Privilege**: Grant minimum required permissions
2. **Separation of Duties**: Avoid conflicting permission combinations
3. **Regular Review**: Periodically audit template and preset usage
4. **Access Control**: Limit who can create and modify templates

## Monitoring and Analytics

### Template Usage Metrics

- Most used templates by category
- Template application success rates
- Customization patterns
- Version adoption rates

### Security Metrics

- Permission combination analysis
- Unusual permission patterns
- Template modification frequency
- Access violation patterns

## Future Enhancements

### Planned Features

1. **Template Versioning**: Advanced version control and rollback
2. **Template Inheritance**: Hierarchical template relationships
3. **Advanced Customization**: Complex permission modification rules
4. **Template Marketplace**: Share templates across organizations
