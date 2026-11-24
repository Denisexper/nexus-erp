import { http } from "./http";

export const inventoryTransfersApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/inventory-transfers${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/inventory-transfers/${id}`);
  },

  create(data) {
    return http.request("/inventory-transfers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  dispatch(id) {
    return http.request(`/inventory-transfers/${id}/dispatch`, { method: "PATCH" });
  },

  receive(id, data) {
    return http.request(`/inventory-transfers/${id}/receive`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  reportIncident(id, data) {
    return http.request(`/inventory-transfers/${id}/incident`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  resolveIncident(id, data) {
    return http.request(`/inventory-transfers/${id}/resolve-incident`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
