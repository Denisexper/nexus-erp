import { http } from "./http";

export const purchaseOrderExpenseDocumentsApi = {
  getByExpense(expenseId) {
    return http.request(`/purchase-order-expense-documents/expense/${expenseId}`);
  },

  upload(expenseId, file) {
    const formData = new FormData();
    formData.append("document", file);
    return http.upload(`/purchase-order-expense-documents/expense/${expenseId}`, formData);
  },

  remove(id) {
    return http.request(`/purchase-order-expense-documents/${id}`, {
      method: "DELETE",
    });
  },
};
