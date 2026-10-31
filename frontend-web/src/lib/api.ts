import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './constants';
import { AuthResponse, RefreshTokenDto } from '@/types/auth';
import { parseApiError, getFieldValidationErrors } from './errorHandler';
import { setCookie, getCookie, deleteCookie } from './cookieUtils';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (
          response.data &&
          typeof response.data === 'object' &&
          'success' in response.data &&
          'data' in response.data
        ) {
          response.data = response.data.data;
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
              window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
            }
            // Rewrite the refresh error too
            const friendlyMsg = parseApiError(refreshError);
            const friendlyErr = new Error(friendlyMsg);
            return Promise.reject(friendlyErr);
          }
        }

        // Expose the actual API error in console and logs for debugging
        console.error('API Request Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          response: error.response?.data,
          originalError: error
        });

        // ── Convert every API error to a friendly Error object ────────────────
        // This means every catch block in store slices and components will
        // automatically receive a human-readable error.message.
        const friendlyMessage = parseApiError(error);
        const friendlyError = new Error(friendlyMessage);
        // Attach extra metadata so advanced callers can use it
        (friendlyError as any).status = error.response?.status;
        (friendlyError as any).fieldErrors = getFieldValidationErrors(error);
        (friendlyError as any).isNetworkError = !error.response;
        (friendlyError as any).originalError = error;
        return Promise.reject(friendlyError);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || getCookie('accessToken');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken') || getCookie('refreshToken');
    }
    return null;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post<{ success: boolean; data: TokenResponse }>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken } as RefreshTokenDto,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const payload =
          response.data &&
          typeof response.data === 'object' &&
          'data' in response.data
            ? response.data.data
            : (response.data as TokenResponse);

        const { accessToken, refreshToken: newRefreshToken } = payload;
        this.setTokens(accessToken, newRefreshToken);

        return accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public setTokens(
    accessToken: string,
    refreshToken: string,
    user?: { role?: string; userType?: string },
    rememberMe: boolean = true
  ) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const days = rememberMe ? 30 : 1;
    setCookie('accessToken', accessToken, days);
    setCookie('refreshToken', refreshToken, days);
    if (user?.role) setCookie('userRole', user.role, days);
    if (user?.userType) setCookie('userType', user.userType, days);
  }

  public clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('userRole');
    deleteCookie('userType');
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  // Generic HTTP methods to mirror Axios instance where needed
  public async get(url: string, config?: unknown) {
    return this.client.get(url, config as any);
  }

  public async post(url: string, data?: unknown, config?: unknown) {
    return this.client.post(url, data, config as any);
  }

  public async patch(url: string, data?: unknown, config?: unknown) {
    return this.client.patch(url, data, config as any);
  }

  public async delete(url: string, config?: unknown) {
    return this.client.delete(url, config as any);
  }

  // Auth endpoints
  public async register(data: unknown) {
    return this.client.post<AuthResponse>('/auth/register', data);
  }

  public async login(data: unknown) {
    return this.client.post<AuthResponse>('/auth/login', data);
  }

  public async requestOtp(phone: string) {
    return this.client.post('/auth/request-otp', { phone });
  }

  public async verifyOtp(data: unknown) {
    return this.client.post<AuthResponse>('/auth/verify-otp', data);
  }

  public async resendOtp(phone: string) {
    return this.client.post('/auth/resend-otp', { phone });
  }

  public async forgotPassword(data: unknown) {
    return this.client.post('/auth/forgot-password', data);
  }

  public async resetPassword(data: unknown) {
    return this.client.post('/auth/reset-password', data);
  }

  public async changePassword(data: unknown) {
    return this.client.post('/auth/change-password', data);
  }

  public async logout() {
    return this.client.post('/auth/logout');
  }

  public async socialLogin(data: unknown) {
    return this.client.post<AuthResponse>('/auth/social-login', data);
  }

  public async getProfile() {
    return this.client.get('/auth/me');
  }

  // User endpoints
  public async getUserProfile() {
    return this.client.get('/users/me');
  }

  public async updateProfile(data: unknown) {
    return this.client.put('/users/me', data);
  }

  public async submitKyc(data: unknown) {
    return this.client.post('/users/me/kyc', data);
  }

  public async getUsers(params?: unknown) {
    return this.client.get('/users', { params });
  }

  public async verifyKyc(userId: string, data: unknown) {
    return this.client.patch(`/users/${userId}/kyc`, data);
  }

  public async suspendUser(userId: string, data?: unknown) {
    return this.client.patch(`/users/${userId}/suspend`, data);
  }

  public async deleteUser(userId: string) {
    return this.client.delete(`/users/${userId}`);
  }

  // Trip endpoints
  public async getTrips(params?: unknown) {
    return this.client.get('/trips', { params });
  }

  public async searchTrips(params?: unknown) {
    const normalizedParams = { ...(params as Record<string, any>) };

    if ('origin' in normalizedParams) {
      normalizedParams.source = normalizedParams.origin;
      delete normalizedParams.origin;
    }

    if ('originLat' in normalizedParams) {
      normalizedParams.sourceLat = normalizedParams.originLat;
      delete normalizedParams.originLat;
    }

    if ('originLng' in normalizedParams) {
      normalizedParams.sourceLng = normalizedParams.originLng;
      delete normalizedParams.originLng;
    }

    if ('destination' in normalizedParams) {
      normalizedParams.destination = normalizedParams.destination;
    }

    return this.client.get('/trips/search', { params: normalizedParams });
  }

  public async getTrip(id: string) {
    return this.client.get(`/trips/${id}`);
  }

  public async createTrip(data: unknown) {
    return this.client.post('/trips', data);
  }

  public async getMyTrips(params?: unknown) {
    return this.client.get('/trips/my-trips', { params });
  }

  public async updateTrip(id: string, data: unknown) {
    return this.client.put(`/trips/${id}`, data);
  }

  public async updateTripStatus(id: string, data: unknown) {
    return this.client.patch(`/trips/${id}/status`, data);
  }

  public async assignDriver(tripId: string, driverId: string) {
    return this.client.patch(`/trips/${tripId}/assign-driver`, { driverId });
  }

  public async deleteTrip(id: string) {
    return this.client.delete(`/trips/${id}`);
  }

  public async getAdminTrips(params?: unknown) {
    return this.client.get('/trips', { params });
  }

  public async createVehicle(data: unknown) {
    return this.client.post('/vehicles', data);
  }

  public async getMyVehicles() {
    return this.client.get('/vehicles/my-vehicles');
  }

  public async getVehicleOwnerStats() {
    return this.client.get('/vehicles/stats');
  }

  public async getVehicle(id: string) {
    return this.client.get(`/vehicles/${id}`);
  }

  public async updateVehicle(id: string, data: unknown) {
    return this.client.put(`/vehicles/${id}`, data);
  }

  public async deleteVehicle(id: string) {
    return this.client.delete(`/vehicles/${id}`);
  }

  public async verifyVehicle(id: string, data: unknown) {
    return this.client.patch(`/vehicles/${id}/verify`, data);
  }

  public async uploadVehicleDocument(id: string, data: unknown) {
    return this.client.post(`/vehicles/${id}/documents`, data);
  }

  public async getAdminVehicles(params?: unknown) {
    return this.client.get('/vehicles', { params });
  }

  public async suspendVehicle(id: string, data: unknown) {
    return this.client.patch(`/vehicles/${id}/suspend`, data);
  }

  public async reactivateVehicle(id: string) {
    return this.client.patch(`/vehicles/${id}/reactivate`);
  }

  public async getVehicleApprovalHistory(id: string) {
    return this.client.get(`/vehicles/${id}/approval-history`);
  }

  public async getAdminVehicleStats() {
    return this.client.get('/vehicles/stats/admin');
  }

  public async getFleetDrivers(params?: unknown) {
    return this.client.get('/fleet/drivers', { params });
  }

  public async getFleetRevenue(params?: unknown) {
    return this.client.get('/fleet/revenue', { params });
  }

  public async updateFleetStatus(id: string, status: string) {
    return this.client.patch(`/fleet/${id}/status`, { status });
  }

  // Booking endpoints
  public async createBooking(data: unknown) {
    return this.client.post('/bookings', data);
  }

  public async getMyBookings(params?: unknown) {
    return this.client.get('/bookings/my-bookings', { params });
  }

  public async getBooking(id: string) {
    return this.client.get(`/bookings/${id}`);
  }

  public async cancelBooking(id: string, data: unknown) {
    return this.client.patch(`/bookings/${id}/cancel`, data);
  }

  public async updateBookingStatus(id: string, data: unknown) {
    return this.client.patch(`/bookings/${id}/status`, data);
  }

  public async getAdminBookings(params?: unknown) {
    return this.client.get('/bookings', { params });
  }

  // Payment endpoints
  public async createStripeIntent(data: unknown) {
    return this.client.post('/payments/stripe/intent', data);
  }

  public async createRazorpayOrder(data: unknown) {
    return this.client.post('/payments/razorpay/order', data);
  }

  public async verifyRazorpayPayment(data: unknown) {
    return this.client.post('/payments/razorpay/verify', data);
  }

  public async getWallet() {
    return this.client.get('/payments/wallet');
  }

  public async topUpWallet(data: { amount: number; method: 'stripe' | 'razorpay' }) {
    return this.client.post('/payments/wallet/topup/initiate', data);
  }

  public async getTransactions(params?: unknown) {
    return this.client.get('/payments/wallet/transactions', { params });
  }

  public async payWithWallet(bookingId: string) {
    return this.client.post('/payments/wallet/pay', { bookingId });
  }

  public async getRefundHistory(params?: unknown) {
    return this.client.get('/payments/refund/history', { params });
  }

  public async refundPayment(data: { paymentId: string; amount: number; reason: string }) {
    return this.client.post('/payments/refund', data);
  }

  // Notification endpoints
  public async getNotifications(params?: unknown) {
    return this.client.get('/notifications', { params });
  }

  public async getUnreadCount() {
    return this.client.get('/notifications/unread-count');
  }

  public async markRead(ids: string[]) {
    return this.client.patch('/notifications/mark-read', { notificationIds: ids });
  }

  public async markAllRead() {
    return this.client.patch('/notifications/mark-all-read');
  }

  public async deleteNotification(id: string) {
    return this.client.delete(`/notifications/${id}`);
  }

  public async getNotificationPreferences() {
    return this.client.get('/notifications/preferences');
  }

  public async updateNotificationPreferences(data: unknown) {
    return this.client.patch('/notifications/preferences', data);
  }

  // Search endpoints
  public async globalSearch(params?: unknown) {
    return this.client.get('/search/global', { params });
  }

  public async autocomplete(query: string) {
    return this.client.get('/search/autocomplete', { params: { q: query } });
  }

  public async getPopularRoutes() {
    return this.client.get('/search/popular-routes');
  }

  public async getSearchFilters() {
    return this.client.get('/search/filters');
  }

  // Tracking endpoints
  public async getLiveLocation(tripId: string) {
    return this.client.get(`/tracking/trip/${tripId}/live`);
  }

  public async getNearbyVehicles(params?: unknown) {
    return this.client.get('/tracking/nearby', { params });
  }

  public async getAllLiveVehicles() {
    return this.client.get('/tracking/live-vehicles');
  }

  public async getTripLocationHistory(tripId: string) {
    return this.client.get(`/tracking/trip/${tripId}`);
  }

  public async getLiveTripLocation(tripId: string) {
    return this.client.get(`/tracking/trip/${tripId}/live`);
  }

  public async updateLocation(data: unknown) {
    return this.client.post('/tracking/update', data);
  }

  public async getDriverLocations(driverId: string, params?: unknown) {
    return this.client.get(`/tracking/driver/${driverId}`, { params });
  }

  // Fleet endpoints
  public async getFleets(params?: unknown) {
    return this.client.get('/fleet', { params });
  }

  public async createFleet(data: unknown) {
    return this.client.post('/fleet', data);
  }

  public async updateFleet(id: string, data: unknown) {
    return this.client.put(`/fleet/${id}`, data);
  }

  public async deleteFleet(id: string) {
    return this.client.delete(`/fleet/${id}`);
  }

  public async getMyFleets() {
    return this.client.get('/fleet/my-fleets');
  }

  public async getFleetVehicles(fleetId: string) {
    return this.client.get(`/fleet/${fleetId}/vehicles`);
  }

  public async addVehicle(fleetId: string, data: unknown) {
    return this.client.post(`/fleet/${fleetId}/vehicles`, data);
  }

  public async getFleetAnalytics(fleetId: string) {
    return this.client.get(`/fleet/${fleetId}/analytics`);
  }

  // Admin endpoints
  public async getAdminMetrics() {
    return this.client.get('/admin/dashboard');
  }

  public async getPendingApprovals(params?: unknown) {
    return this.client.get('/admin/pending-approvals', { params });
  }

  public async getActiveTrips() {
    return this.client.get('/admin/active-trips');
  }

  public async getAdminPayments(params?: unknown) {
    return this.client.get('/admin/payments', { params });
  }

  public async getAuditLogs(params?: unknown) {
    return this.client.get('/admin/audit-logs', { params });
  }

  public async generateAdminReport(data: unknown) {
    return this.client.post('/admin/reports/generate', data);
  }

  public async updateAdminSettings(data: unknown) {
    return this.client.post('/admin/settings', data);
  }

  public async updateCommission(data: unknown) {
    return this.client.post('/admin/commission', data);
  }

  public async getAdminRoles() {
    return this.client.get('/admin/roles');
  }

  public async createAdminRole(data: unknown) {
    return this.client.post('/admin/roles', data);
  }

  public async updateAdminRole(id: string, data: unknown) {
    return this.client.put(`/admin/roles/${id}`, data);
  }

  public async deleteAdminRole(id: string) {
    return this.client.delete(`/admin/roles/${id}`);
  }

  public async getAdminPermissions() {
    return this.client.get('/admin/permissions');
  }

  public async createAdminPermission(data: unknown) {
    return this.client.post('/admin/permissions', data);
  }

  public async updateAdminPermission(id: string, data: unknown) {
    return this.client.put(`/admin/permissions/${id}`, data);
  }

  public async deleteAdminPermission(id: string) {
    return this.client.delete(`/admin/permissions/${id}`);
  }

  public async updateRolePermissions(roleId: string, permissionIds: string[]) {
    return this.client.post(`/admin/roles/${roleId}/permissions`, { permissionIds });
  }

  public async getRecentSearches(userId: string) {
    return this.client.get('/search/recent', { params: { userId } });
  }

  public async getAnalyticsDashboard(params?: unknown) {
    return this.client.get('/analytics/dashboard', { params });
  }

  public async getRevenueAnalytics(params?: unknown) {
    return this.client.get('/analytics/revenue', { params });
  }

  public async getBookingAnalytics(params?: unknown) {
    return this.client.get('/analytics/bookings', { params });
  }

  public async getUserAnalytics(params?: unknown) {
    return this.client.get('/analytics/users', { params });
  }

  public async getVehicleUtilization(params?: unknown) {
    return this.client.get('/analytics/vehicles/utilization', { params });
  }

  public async getTripPerformance(params?: unknown) {
    return this.client.get('/analytics/trips/performance', { params });
  }

  public async exportAnalytics(params?: unknown) {
    return this.client.get('/analytics/export', { params });
  }

  public async getRealtimeMetrics(params?: unknown) {
    return this.client.get('/analytics/realtime', { params });
  }

  // Support endpoints
  public async createTicket(data: unknown) {
    return this.client.post('/support/tickets', data);
  }

  public async getTickets(params?: unknown) {
    return this.client.get('/support/tickets', { params });
  }

  public async getTicket(id: string) {
    return this.client.get(`/support/tickets/${id}`);
  }

  public async updateTicket(id: string, data: unknown) {
    return this.client.patch(`/support/tickets/${id}`, data);
  }

  public async assignTicket(id: string, data: unknown) {
    return this.client.post(`/support/tickets/${id}/assign`, data);
  }

  public async escalateTicket(id: string, data: unknown) {
    return this.client.post(`/support/tickets/${id}/escalate`, data);
  }

  public async resolveTicket(id: string, data: unknown) {
    return this.client.post(`/support/tickets/${id}/resolve`, data);
  }

  public async reopenTicket(id: string, data: unknown) {
    return this.client.post(`/support/tickets/${id}/reopen`, data);
  }

  public async addTicketComment(id: string, data: unknown) {
    return this.client.post(`/support/tickets/${id}/comments`, data);
  }

  public async deleteTicket(id: string) {
    return this.client.delete(`/support/tickets/${id}`);
  }

  public async getTicketStats(params?: unknown) {
    return this.client.get('/support/stats', { params });
  }

  public async getTicketCategories() {
    return this.client.get('/support/categories');
  }
}

export const apiClient = new ApiClient();
export default apiClient;