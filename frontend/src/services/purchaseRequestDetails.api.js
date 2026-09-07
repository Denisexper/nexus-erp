import { http } from "./http";

export const purchaseRequestDetailsApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/purchase-request-details${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/purchase-request-details/${id}`);
  },

  create(data) {
    return http.request("/purchase-request-details", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return http.request(`/purchase-request-details/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id) {
    return http.request(`/purchase-request-details/${id}`, { method: "DELETE" });
  },
};
