import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionTemplatesService } from './permission-templates.service';
import { CreatePermissionTemplateDto } from './dto/create-permission-template.dto';
import { UpdatePermissionTemplateDto } from './dto/update-permission-template.dto';
import { CreatePermissionPresetDto } from './dto/create-permission-preset.dto';
import { UpdatePermissionPresetDto } from './dto/update-permission-preset.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('permission-templates')
@UseGuards(PermissionsGuard)
export class PermissionTemplatesController {
  constructor(
    private readonly permissionTemplatesService: PermissionTemplatesService,
  ) {}

  // Template endpoints
  @Post()
  @RequirePermissions(['manage_permission_templates'])
  create(@Body() createTemplateDto: CreatePermissionTemplateDto) {
    return this.permissionTemplatesService.createTemplate(createTemplateDto);
  }

  @Get()
  @RequirePermissions(['view_permission_templates'])
  findAll() {
    return this.permissionTemplatesService.findAllTemplates();
  }

  @Get('categories')
  @RequirePermissions(['view_permission_templates'])
  getCategories() {
    return this.permissionTemplatesService.getTemplateCategories();
  }

  @Get('category/:category')
  @RequirePermissions(['view_permission_templates'])
  findByCategory(@Param('category') category: string) {
    return this.permissionTemplatesService.findTemplatesByCategory(category);
  }

  @Get(':id')
  @RequirePermissions(['view_permission_templates'])
  findOne(@Param('id') id: string) {
    return this.permissionTemplatesService.findTemplateById(id);
  }

  @Get('name/:name')
  @RequirePermissions(['view_permission_templates'])
  findByName(@Param('name') name: string) {
    return this.permissionTemplatesService.findTemplateByName(name);
  }

  @Patch(':id')
  @RequirePermissions(['manage_permission_templates'])
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdatePermissionTemplateDto,
  ) {
    return this.permissionTemplatesService.updateTemplate(
      id,
      updateTemplateDto,
    );
  }

  @Delete(':id')
  @RequirePermissions(['manage_permission_templates'])
  remove(@Param('id') id: string) {
    return this.permissionTemplatesService.deleteTemplate(id);
  }

  // Preset endpoints
  @Post('presets')
  @RequirePermissions(['manage_permission_templates'])
  createPreset(@Body() createPresetDto: CreatePermissionPresetDto) {
    return this.permissionTemplatesService.createPreset(createPresetDto);
  }

  @Get('presets')
  @RequirePermissions(['view_permission_templates'])
  findAllPresets() {
    return this.permissionTemplatesService.findAllPresets();
  }

  @Get('presets/:id')
  @RequirePermissions(['view_permission_templates'])
  findPresetById(@Param('id') id: string) {
    return this.permissionTemplatesService.findPresetById(id);
  }

  @Patch('presets/:id')
  @RequirePermissions(['manage_permission_templates'])
  updatePreset(
    @Param('id') id: string,
    @Body() updatePresetDto: UpdatePermissionPresetDto,
  ) {
    return this.permissionTemplatesService.updatePreset(id, updatePresetDto);
  }

  @Delete('presets/:id')
  @RequirePermissions(['manage_permission_templates'])
  removePreset(@Param('id') id: string) {
    return this.permissionTemplatesService.deletePreset(id);
  }

  // Utility endpoints
  @Get('presets/:id/permissions')
  @RequirePermissions(['view_permission_templates'])
  getPresetPermissions(@Param('id') id: string) {
    return this.permissionTemplatesService.getPresetPermissions(id);
  }
}

