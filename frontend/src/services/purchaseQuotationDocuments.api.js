import { http } from "./http";

export const purchaseQuotationDocumentsApi = {
  getByQuotation(quotationId) {
    return http.request(`/purchase-quotation-documents/quotation/${quotationId}`);
  },

  upload(quotationId, file) {
    const formData = new FormData();
    formData.append("document", file);
    return http.upload(`/purchase-quotation-documents/quotation/${quotationId}`, formData);
  },

  remove(id) {
    return http.request(`/purchase-quotation-documents/${id}`, {
      method: "DELETE",
    });
  },
};
