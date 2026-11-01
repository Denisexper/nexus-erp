import { http } from "./http";

export const inventoryApi = {
  getLots(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/inventory/lots${params ? `?${params}` : ""}`);
  },

  getLotById(id) {
    return http.request(`/inventory/lots/${id}`);
  },

  assignLotToLocation(id, data) {
    return http.request(`/inventory/lots/${id}/assign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
