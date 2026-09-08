import { http } from "./http";

export const expenseTypesApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/expense-types${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/expense-types/${id}`);
  },

  create(data) {
    return http.request("/expense-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return http.request(`/expense-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  activate(id) {
    return http.request(`/expense-types/${id}/activate`, {
      method: "PATCH",
    });
  },

  deactivate(id) {
    return http.request(`/expense-types/${id}/deactivate`, {
      method: "PATCH",
    });
  },

  getHistory(id) {
    return http.request(`/expense-types/${id}/history`);
  },
};
