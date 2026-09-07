import { http } from "./http";

export const purchaseQuotationsApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/purchase-quotations${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/purchase-quotations/${id}`);
  },

  create(data) {
    return http.request("/purchase-quotations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return http.request(`/purchase-quotations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  reject(id) {
    return http.request(`/purchase-quotations/${id}/reject`, { method: "PATCH" });
  },

  cancel(id) {
    return http.request(`/purchase-quotations/${id}/cancel`, { method: "PATCH" });
  },

  getHistory(id) {
    return http.request(`/purchase-quotations/${id}/history`);
  },

  getComparison(purchaseRequestId) {
    return http.request(`/purchase-quotations/comparison/${purchaseRequestId}`);
  },
};
