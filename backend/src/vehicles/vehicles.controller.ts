import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../database/entities/role.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
  VehicleDocumentDto,
  VerifyVehicleDto,
  SuspendVehicleDto,
  ReactivateVehicleDto,
} from './dto/vehicle.dto';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new vehicle' })
  async create(
    @CurrentUser('id') ownerId: string,
    @Body() createVehicleDto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(ownerId, createVehicleDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all vehicles (Admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-vehicles')
  @ApiOperation({ summary: 'Get current user vehicles' })
  async findMyVehicles(@CurrentUser('id') ownerId: string) {
    return this.vehiclesService.findByOwner(ownerId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @ApiOperation({ summary: 'Get vehicle statistics' })
  async getStats(@CurrentUser('id') ownerId: string) {
    return this.vehiclesService.getVehicleStats(ownerId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get('stats/admin')
  @ApiOperation({ summary: 'Get vehicle stats for admin dashboard (counts by status)' })
  async getAdminStats() {
    return this.vehiclesService.getAdminVehicleStats();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.vehiclesService.findById(id, userId, userRole);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, ownerId, updateVehicleDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify/Reject vehicle (Admin only)' })
  async verifyVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() verifyDto: VerifyVehicleDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.vehiclesService.verifyVehicle(id, verifyDto, adminId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend vehicle (Admin only)' })
  async suspendVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() suspendDto: SuspendVehicleDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.vehiclesService.suspendVehicle(id, suspendDto, adminId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate suspended vehicle (Admin only)' })
  async reactivateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.vehiclesService.reactivateVehicle(id, adminId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get(':id/approval-history')
  @ApiOperation({ summary: 'Get vehicle approval history (Admin only)' })
  async getApprovalHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.getVehicleApprovalHistory(id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload vehicle document' })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() documentDto: VehicleDocumentDto,
  ) {
    return this.vehiclesService.uploadDocument(id, ownerId, documentDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete vehicle' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.vehiclesService.delete(id, ownerId);
  }
}