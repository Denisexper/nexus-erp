import { http } from "./http";

class ApiService {
  getToken() {
    return http.getToken();
  }

  setToken(token) {
    http.setToken(token);
  }

  removeToken() {
    http.removeToken();
  }

  // Auth
  async login(slug, email, password) {
    const data = await http.request("/login", {
      method: "POST",
      body: JSON.stringify({ slug, email, password }),
    });

    if (data.token) {
      http.setToken(data.token);
    }

    return data;
  }

  async getMe() {
    return http.request("/me");
  }

  async register(name, email, password, role = "user") {
    const data = await http.request("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });

    if (data.token) {
      http.setToken(data.token);
    }

    return data;
  }

  async logout() {
    return http.request("/logout", {
      method: "POST",
    });
  }

  // Users
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/users${params ? `?${params}` : ""}`);
  }

  async createUser(userData) {
    return http.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getUser(id) {
    return http.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return http.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return http.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  async getUserHistory(userId) {
    return http.request(`/users/${userId}/history`);
  }

  async toggleUserStatus(id) {
    return http.request(`/users/${id}/toggle-status`, {
      method: "PATCH",
    });
  }

  async unlockUser(id) {
    return http.request(`/users/${id}/unlock`, {
      method: "PATCH",
    });
  }

  // Logs
  async getLogs(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/logs${params ? `?${params}` : ""}`);
  }

  async exportLogsToExcel(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.requestBlob(`/logs/reports/excel${params ? `?${params}` : ""}`);
  }

  async exportLogsToPDF(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.requestBlob(`/logs/reports/pdf${params ? `?${params}` : ""}`);
  }

  // Solo disponible en desarrollo (bloqueado en el backend si NODE_ENV=production)
  async deleteAllLogs() {
    return http.request("/logs/dev/purge", {
      method: "DELETE",
    });
  }

  // Roles
  async getRoles(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return http.request(`/roles${queryParams ? `?${queryParams}` : ""}`);
  }

  async getRole(id) {
    return http.request(`/roles/${id}`);
  }

  async getPermissions() {
    return http.request("/roles/permissions");
  }

  async createRole(roleData) {
    return http.request("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  }

  async updateRole(id, roleData) {
    return http.request(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  }

  async deleteRole(id) {
    return http.request(`/roles/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiService();
