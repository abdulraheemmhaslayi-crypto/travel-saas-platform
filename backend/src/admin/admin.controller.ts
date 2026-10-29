import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RoleName } from "../database/entities/role.entity";
import {
  DashboardStatsQueryDto,
  ApproveVehicleDto,
  VerifyKycDto,
  UpdateCommissionDto,
  GenerateReportDto,
  CreateRoleDto,
  CreatePermissionDto,
  UpdateRolePermissionsDto,
} from "./dto/admin.dto";

@ApiTags("Admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get("dashboard")
  @ApiOperation({ summary: "Get admin dashboard statistics" })
  async getDashboardStats(
    @Query() query: DashboardStatsQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.adminService.getDashboardStats(query, currentUser);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get("pending-approvals")
  @ApiOperation({ summary: "Get pending KYC and vehicle approvals" })
  async getPendingApprovals(@Query("type") type: "kyc" | "vehicles" | "all") {
    return this.adminService.getPendingApprovals(type);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get("active-trips")
  @ApiOperation({ summary: "Get currently active trips" })
  async getActiveTrips() {
    return this.adminService.getActiveTrips();
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get("bookings")
  @ApiOperation({ summary: "Get all bookings with filters" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async getAllBookings(@Query() query: any) {
    return this.adminService.getAllBookings(query);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get("payments")
  @ApiOperation({ summary: "Get all payments with filters" })
  async getAllPayments(@Query() query: any) {
    return this.adminService.getAllPayments(query);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Get("users/growth")
  @ApiOperation({ summary: "Get user growth analytics" })
  async getUserGrowth(
    @Query("period") period: "daily" | "weekly" | "monthly" = "monthly",
  ) {
    return this.adminService.getUserGrowth(period);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Get("revenue")
  @ApiOperation({ summary: "Get revenue analytics" })
  async getRevenueAnalytics(
    @Query("period")
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
  ) {
    return this.adminService.getRevenueAnalytics(period);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Get("heatmap")
  @ApiOperation({ summary: "Get route heatmap data" })
  async getHeatmapData(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.adminService.getHeatmapData(startDate, endDate);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Post("commission")
  @ApiOperation({ summary: "Update platform commission" })
  async updateCommission(
    @Body() commissionDto: UpdateCommissionDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminService.updateCommission(commissionDto, adminId);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @Post("reports/generate")
  @ApiOperation({ summary: "Generate report" })
  async generateReport(
    @Body() reportDto: GenerateReportDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.adminService.generateReport(reportDto, currentUser);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Get("audit-logs")
  @ApiOperation({ summary: "Get audit logs" })
  async getAuditLogs(@Query() query: any) {
    return this.adminService.getAuditLogs(query);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Post("settings")
  @ApiOperation({ summary: "Update platform settings" })
  async updateSettings(
    @Body() settings: Record<string, any>,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminService.updateSettings(settings, adminId);
  }

  // RBAC Roles Routes
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Get("roles")
  @ApiOperation({ summary: "Get all roles" })
  async getRoles() {
    return this.adminService.getRoles();
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Post("roles")
  @ApiOperation({ summary: "Create a new role" })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.adminService.createRole(createRoleDto);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Put("roles/:id")
  @ApiOperation({ summary: "Update an existing role" })
  async updateRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateRoleDto: Partial<CreateRoleDto>,
  ) {
    return this.adminService.updateRole(id, updateRoleDto);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Delete("roles/:id")
  @ApiOperation({ summary: "Delete a role" })
  async deleteRole(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminService.deleteRole(id);
  }

  // RBAC Permissions Routes
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Get("permissions")
  @ApiOperation({ summary: "Get all permissions" })
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Post("permissions")
  @ApiOperation({ summary: "Create a new permission" })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.adminService.createPermission(createPermissionDto);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Put("permissions/:id")
  @ApiOperation({ summary: "Update a permission" })
  async updatePermission(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: Partial<CreatePermissionDto>,
  ) {
    return this.adminService.updatePermission(id, updatePermissionDto);
  }

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Delete("permissions/:id")
  @ApiOperation({ summary: "Delete a permission" })
  async deletePermission(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminService.deletePermission(id);
  }

  // Role Permissions Mapping Route
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  @Post("roles/:roleId/permissions")
  @ApiOperation({ summary: "Map permissions to a role" })
  async updateRolePermissions(
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Body() body: UpdateRolePermissionsDto,
  ) {
    return this.adminService.updateRolePermissions(roleId, body.permissionIds);
  }
}
