import { http } from "./http";

export const inventoryLabelPrintsApi = {
  getByLot(lotId) {
    return http.request(`/inventory-label-prints/lot/${lotId}`);
  },

  print(data) {
    return http.request("/inventory-label-prints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPdf(id) {
    return http.requestBlob(`/inventory-label-prints/${id}/pdf`);
  },
};
