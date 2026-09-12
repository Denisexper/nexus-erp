import { http } from "./http";

export const retaceosApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/retaceos${params ? `?${params}` : ""}`);
  },

  getById(id) {
    return http.request(`/retaceos/${id}`);
  },

  create(data) {
    return http.request("/retaceos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getHistory(id) {
    return http.request(`/retaceos/${id}/history`);
  },
};
