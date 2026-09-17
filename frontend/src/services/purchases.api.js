import { http } from "./http";

export const purchasesApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/purchases${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/purchases/${id}`);
  },

  create(data) {
    return http.request("/purchases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  cancel(id) {
    return http.request(`/purchases/${id}/cancel`, { method: "PATCH" });
  },

  getHistory(id) {
    return http.request(`/purchases/${id}/history`);
  },
};
