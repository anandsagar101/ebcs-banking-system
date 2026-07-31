import api from "@/lib/api";

// Customers
export const listCustomers = () => api.get("/customers").then((r) => r.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then((r) => r.data);
export const createCustomer = (payload) => api.post("/customers", payload).then((r) => r.data);
export const updateCustomer = (id, payload) => api.put(`/customers/${id}`, payload).then((r) => r.data);
export const updateKyc = (id, status) => api.put(`/customers/${id}/kyc?status=${status}`).then((r) => r.data);

// Products
export const listProducts = () => api.get("/products").then((r) => r.data);
export const createProduct = (payload) => api.post("/products", payload).then((r) => r.data);
export const getProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);

// Accounts
export const listAccounts = () => api.get("/accounts").then((r) => r.data);
export const getAccount = (id) => api.get(`/accounts/${id}`).then((r) => r.data);
export const accountsByCustomer = (customerId) => api.get(`/accounts/customer/${customerId}`).then((r) => r.data);
export const accountBalance = (id) => api.get(`/accounts/${id}/balance`).then((r) => r.data);
export const openAccount = (payload) => api.post("/accounts", payload).then((r) => r.data);

// Transactions
export const listTransactions = () => api.get("/transactions").then((r) => r.data);
export const getTransaction = (ref) => api.get(`/transactions/${ref}`).then((r) => r.data);
export const deposit = (payload) => api.post("/transactions/deposit", payload).then((r) => r.data);
export const withdraw = (payload) => api.post("/transactions/withdraw", payload).then((r) => r.data);
export const transfer = (payload) => api.post("/transactions/transfer", payload).then((r) => r.data);
export const imps = (payload) => api.post("/transactions/imps", payload).then((r) => r.data);
export const reverseTx = (ref) => api.post(`/transactions/reverse/${ref}`).then((r) => r.data);

// Ledger
export const ledgerByAccount = (accountId) => api.get(`/ledger/account/${accountId}`).then((r) => r.data);
export const ledgerByTx = (ref) => api.get(`/ledger/transaction/${ref}`).then((r) => r.data);

// Deposits
export const listFds = () => api.get("/deposits/fixed").then((r) => r.data);
export const listRds = () => api.get("/deposits/recurring").then((r) => r.data);
export const bookFd = (payload) => api.post("/deposits/fixed", payload).then((r) => r.data);
export const bookRd = (payload) => api.post("/deposits/recurring", payload).then((r) => r.data);

// Loans
export const listLoans = () => api.get("/loans").then((r) => r.data);
export const getLoan = (id) => api.get(`/loans/${id}`).then((r) => r.data);
export const applyLoan = (payload) => api.post("/loans", payload).then((r) => r.data);
export const approveLoan = (id) => api.post(`/loans/${id}/approve`).then((r) => r.data);
export const rejectLoan = (id) => api.post(`/loans/${id}/reject`).then((r) => r.data);
export const disburseLoan = (id, payload) => api.post(`/loans/${id}/disburse`, payload).then((r) => r.data);
export const settleLoan = (id) => api.post(`/loans/${id}/settle`).then((r) => r.data);
export const loanSchedule = (id) => api.get(`/loans/${id}/schedule`).then((r) => r.data);

// Admin
export const listUsers = () => api.get("/admin/users").then((r) => r.data);
export const getUser = (id) => api.get(`/admin/users/${id}`).then((r) => r.data);
export const listConfigs = () => api.get("/admin/config").then((r) => r.data);
export const upsertConfig = (payload) => api.put("/admin/config", payload).then((r) => r.data);

// Auth extras
export const changePassword = (payload) => api.post("/auth/change-password", payload).then((r) => r.data);

// Password reset (email OTP via Resend)
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data);
export const resendResetOtp = (email) => api.post("/auth/resend-otp", { email }).then((r) => r.data);
export const verifyResetOtp = (email, code) => api.post("/auth/verify-otp", { email, code }).then((r) => r.data);
export const resetPassword = (resetToken, newPassword) => api.post("/auth/reset-password", { resetToken, newPassword }).then((r) => r.data);

// MFA login challenge
export const mfaLoginVerify = (challengeToken, code) => api.post("/auth/mfa/login-verify", { challengeToken, code }).then((r) => r.data);

// MFA
export const mfaStatus = () => api.get("/security/mfa/status").then((r) => r.data);
export const mfaEnroll = () => api.post("/security/mfa/enroll").then((r) => r.data);
export const mfaVerify = (code) => api.post("/security/mfa/verify", { code }).then((r) => r.data);
export const mfaDisable = () => api.delete("/security/mfa").then((r) => r.data);

// Sessions
export const loginHistory = (page = 0, size = 20) => api.get(`/security/login-history?page=${page}&size=${size}`).then((r) => r.data);
export const listDevices = () => api.get("/security/devices").then((r) => r.data);
export const trustDevice = (id) => api.post(`/security/devices/${id}/trust`).then((r) => r.data);
export const revokeDevice = (id) => api.post(`/security/devices/${id}/revoke`).then((r) => r.data);

// Notifications
export const listNotifications = (page = 0, size = 20) => api.get(`/notifications?page=${page}&size=${size}`).then((r) => r.data);
export const unreadNotifications = () => api.get("/notifications/unread-count").then((r) => r.data);
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`).then((r) => r.data);
export const getNotifPreferences = () => api.get("/notifications/preferences").then((r) => r.data);
export const setNotifPreferences = (prefs) => api.put("/notifications/preferences", prefs).then((r) => r.data);

// Reports
export const reportOverview = () => api.get("/reports/overview").then((r) => r.data);
export const reportCustomerGrowth = (months = 6) => api.get(`/reports/customers/growth?months=${months}`).then((r) => r.data);
export const reportTxAnalytics = (days = 14) => api.get(`/reports/transactions/analytics?days=${days}`).then((r) => r.data);
export const reportDeposits = () => api.get("/reports/deposits").then((r) => r.data);
export const reportLoans = () => api.get("/reports/loans").then((r) => r.data);
export const reportRevenue = (months = 6) => api.get(`/reports/revenue?months=${months}`).then((r) => r.data);

// Audit
export const listAudit = (page = 0, size = 50) => api.get(`/admin/audit?page=${page}&size=${size}`).then((r) => r.data);

// Feature flags
export const listFeatureFlags = () => api.get("/admin/feature-flags").then((r) => r.data);
export const toggleFeatureFlag = (key, enabled) => api.put(`/admin/feature-flags/${key}?enabled=${enabled}`).then((r) => r.data);

// Documents
export const listDocuments = (ownerType, ownerId) => api.get(`/documents?ownerType=${ownerType}&ownerId=${ownerId}`).then((r) => r.data);
export const documentVersions = (id) => api.get(`/documents/${id}/versions`).then((r) => r.data);
export const runDocumentOcr = (id) => api.post(`/documents/${id}/ocr`).then((r) => r.data);
export const uploadDocument = (ownerType, ownerId, docType, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/documents?ownerType=${ownerType}&ownerId=${ownerId}&docType=${docType}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};
export const documentDownloadUrl = (id) => `${api.defaults.baseURL}/documents/${id}/download`;
export const documentPreviewUrl = (id) => `${api.defaults.baseURL}/documents/${id}/preview`;

