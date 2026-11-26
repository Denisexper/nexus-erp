import { http } from "./http";

export const vehiclesApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/vehicles${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/vehicles/${id}`);
  },

  create(data) {
    return http.request("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return http.request(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  activate(id) {
    return http.request(`/vehicles/${id}/activate`, {
      method: "PATCH",
    });
  },

  deactivate(id) {
    return http.request(`/vehicles/${id}/deactivate`, {
      method: "PATCH",
    });
  },

  getHistory(id) {
    return http.request(`/vehicles/${id}/history`);
  },
};
