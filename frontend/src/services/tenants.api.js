import { http } from "./http";

export const tenantsApi = {
  search(q) {
    return http.request(`/public/companies?search=${encodeURIComponent(q)}`);
  },

  getBySlug(slug) {
    return http.request(`/public/companies/${slug}`);
  },
};
