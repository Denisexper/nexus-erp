import { http } from "./http";

export const purchaseOrdersApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/purchase-orders${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/purchase-orders/${id}`);
  },

  create(data) {
    return http.request("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return http.request(`/purchase-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  approve(id) {
    return http.request(`/purchase-orders/${id}/approve`, { method: "PATCH" });
  },

  cancel(id) {
    return http.request(`/purchase-orders/${id}/cancel`, { method: "PATCH" });
  },

  addExpense(id, data) {
    return http.request(`/purchase-orders/${id}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getTraceability(id) {
    return http.request(`/purchase-orders/${id}/traceability`);
  },

  getHistory(id) {
    return http.request(`/purchase-orders/${id}/history`);
  },
};
