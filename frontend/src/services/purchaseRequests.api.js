import { http } from "./http";

export const purchaseRequestsApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/purchase-requests${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/purchase-requests/${id}`);
  },

  create(data) {
    return http.request("/purchase-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return http.request(`/purchase-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  submit(id) {
    return http.request(`/purchase-requests/${id}/submit`, { method: "PATCH" });
  },

  approve(id) {
    return http.request(`/purchase-requests/${id}/approve`, { method: "PATCH" });
  },

  reject(id) {
    return http.request(`/purchase-requests/${id}/reject`, { method: "PATCH" });
  },

  cancel(id) {
    return http.request(`/purchase-requests/${id}/cancel`, { method: "PATCH" });
  },

  getHistory(id) {
    return http.request(`/purchase-requests/${id}/history`);
  },
};
