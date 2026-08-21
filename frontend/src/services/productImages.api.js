import { http } from "./http";

export const productImagesApi = {
  getByProduct(productId, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return http.request(
      `/product-images/product/${productId}${params ? `?${params}` : ""}`,
    );
  },

  upload(productId, file) {
    const formData = new FormData();
    formData.append("image", file);
    return http.upload(`/product-images/product/${productId}`, formData);
  },

  activate(id) {
    return http.request(`/product-images/${id}/activate`, {
      method: "PATCH",
    });
  },

  deactivate(id) {
    return http.request(`/product-images/${id}/deactivate`, {
      method: "PATCH",
    });
  },
};
