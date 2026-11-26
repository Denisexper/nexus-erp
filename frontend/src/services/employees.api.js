import { http } from "./http";

export const employeesApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/employees${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/employees/${id}`);
  },

  create(data) {
    return http.request("/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return http.request(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  activate(id) {
    return http.request(`/employees/${id}/activate`, {
      method: "PATCH",
    });
  },

  deactivate(id) {
    return http.request(`/employees/${id}/deactivate`, {
      method: "PATCH",
    });
  },

  getHistory(id) {
    return http.request(`/employees/${id}/history`);
  },
};
