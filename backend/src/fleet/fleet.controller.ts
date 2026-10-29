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
import { FleetService } from './fleet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../database/entities/role.entity';
import {
  CreateFleetDto,
  UpdateFleetDto,
  AddFleetVehicleDto,
  UpdateFleetVehicleDto,
  FleetQueryDto,
} from './dto/fleet.dto';

@ApiTags('Fleet')
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create fleet company' })
  async create(
    @CurrentUser('id') ownerId: string,
    @Body() createFleetDto: CreateFleetDto,
  ) {
    return this.fleetService.createFleet(ownerId, createFleetDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-fleets')
  @ApiOperation({ summary: 'Get my fleet companies' })
  async getMyFleets(@CurrentUser('id') ownerId: string) {
    return this.fleetService.findByOwner(ownerId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('drivers')
  @ApiOperation({ summary: 'Get drivers associated with fleet' })
  async getDrivers(@CurrentUser('id') ownerId: string) {
    return this.fleetService.getDrivers(ownerId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('drivers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a driver to fleet' })
  async addDriver(
    @CurrentUser('id') ownerId: string,
    @Body() body: { emailOrPhone: string; licenseNumber?: string },
  ) {
    return this.fleetService.addDriver(ownerId, body.emailOrPhone, body.licenseNumber);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('revenue')
  @ApiOperation({ summary: 'Get fleet revenue stats' })
  async getRevenue(@CurrentUser('id') ownerId: string) {
    return this.fleetService.getRevenueStats(ownerId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get fleet by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.fleetService.findById(id, userId, userRole);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update fleet company' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() updateFleetDto: UpdateFleetDto,
  ) {
    return this.fleetService.update(id, ownerId, updateFleetDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete fleet company' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.fleetService.remove(id, ownerId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/vehicles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add vehicle to fleet' })
  async addVehicle(
    @Param('id', ParseUUIDPipe) fleetId: string,
    @CurrentUser('id') ownerId: string,
    @Body() vehicleDto: AddFleetVehicleDto,
  ) {
    return this.fleetService.addVehicle(fleetId, ownerId, vehicleDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id/vehicles')
  @ApiOperation({ summary: 'Get fleet vehicles' })
  async getFleetVehicles(
    @Param('id', ParseUUIDPipe) fleetId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.fleetService.getFleetVehicles(fleetId, ownerId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Put(':fleetId/vehicles/:vehicleId')
  @ApiOperation({ summary: 'Update fleet vehicle' })
  async updateFleetVehicle(
    @Param('fleetId', ParseUUIDPipe) fleetId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser('id') ownerId: string,
    @Body() updateDto: UpdateFleetVehicleDto,
  ) {
    return this.fleetService.updateFleetVehicle(fleetId, vehicleId, ownerId, updateDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get fleet analytics' })
  async getFleetAnalytics(
    @Param('id', ParseUUIDPipe) fleetId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.fleetService.getFleetAnalytics(fleetId, userId, userRole);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update fleet status (Admin)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
  ) {
    return this.fleetService.updateStatus(id, body.status);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all fleets (Admin)' })
  async findAll(@Query() query: FleetQueryDto) {
    return this.fleetService.findAll(query);
  }
}