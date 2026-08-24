import { http } from "./http";

export const kardexApi = {
  getMovements(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(`/kardex/movements${params ? `?${params}` : ""}`);
  },

  getMovementById(id) {
    return http.request(`/kardex/movements/${id}`);
  },

  registerMovement(data) {
    return http.request("/kardex/movements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  registerTransfer(data) {
    return http.request("/kardex/transfers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getStockByLocation(locationId) {
    return http.request(`/kardex/stock/by-location/${locationId}`);
  },

  getStockByProduct(productId) {
    return http.request(`/kardex/stock/by-product/${productId}`);
  },
};
