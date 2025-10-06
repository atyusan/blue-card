# Hospital Billing Backend API Documentation

## Table of Contents

1. [Authentication](#authentication)
2. [Users Management](#users-management)
3. [Patients Management](#patients-management)
4. [Billing & Invoicing](#billing--invoicing)
5. [Admissions & Wards](#admissions--wards)
6. [Pharmacy Management](#pharmacy-management)
7. [Laboratory Services](#laboratory-services)
8. [Surgical Services](#surgical-services)
9. [Consultations](#consultations)
10. [Services & Pricing](#services--pricing)
11. [Payment Processing](#payment-processing)
12. [Cash Office Integration](#cash-office-integration)
13. [Paystack Integration](#paystack-integration)
14. [Reporting & Analytics](#reporting--analytics)

---

## Base URL

```
http://localhost:3000
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Authentication

### Base Path: `/auth`

| Method | Endpoint         | Description        | Request Body        | Response          |
| ------ | ---------------- | ------------------ | ------------------- | ----------------- |
| `POST` | `/auth/login`    | User login         | `LoginDto`          | JWT token         |
| `POST` | `/auth/validate` | Validate JWT token | `{ token: string }` | Validation result |

---

## 2. Users Management

### Base Path: `/users`

| Method   | Endpoint                | Description     | Query Parameters                              | Response              |
| -------- | ----------------------- | --------------- | --------------------------------------------- | --------------------- |
| `POST`   | `/users`                | Create new user | -                                             | Created user          |
| `GET`    | `/users`                | Get all users   | `role`, `isActive`, `search`, `page`, `limit` | User list (paginated) |
| `GET`    | `/users/:id`            | Get user by ID  | -                                             | User details          |
| `PATCH`  | `/users/:id`            | Update user     | -                                             | Updated user          |
| `DELETE` | `/users/:id`            | Delete user     | -                                             | Success message       |
| `PATCH`  | `/users/:id/deactivate` | Deactivate user | -                                             | Success message       |

---

## 3. Patients Management

### Base Path: `/patients`

| Method   | Endpoint                             | Description                   | Query Parameters                      | Response                 |
| -------- | ------------------------------------ | ----------------------------- | ------------------------------------- | ------------------------ |
| `POST`   | `/patients`                          | Create new patient            | -                                     | Created patient          |
| `GET`    | `/patients`                          | Get all patients              | `search`, `isActive`, `page`, `limit` | Patient list (paginated) |
| `GET`    | `/patients/:id`                      | Get patient by ID             | -                                     | Patient details          |
| `GET`    | `/patients/by-patient-id/:patientId` | Get patient by patient ID     | -                                     | Patient details          |
| `PATCH`  | `/patients/:id`                      | Update patient                | -                                     | Updated patient          |
| `DELETE` | `/patients/:id`                      | Deactivate patient            | -                                     | Success message          |
| `GET`    | `/patients/:id/account`              | Get patient account balance   | -                                     | Account information      |
| `GET`    | `/patients/:id/financial-summary`    | Get patient financial summary | -                                     | Financial summary        |
| `GET`    | `/patients/:id/outstanding-balance`  | Get outstanding balance       | -                                     | Outstanding balance      |
| `GET`    | `/patients/:id/recent-activity`      | Get recent activity           | `days`                                | Recent activity          |
| `POST`   | `/patients/:id/registration-invoice` | Create registration invoice   | `registrationFee`                     | Invoice created          |
| `GET`    | `/patients/:id/billing-history`      | Get billing history           | `startDate`, `endDate`                | Billing history          |

---

## 4. Billing & Invoicing

### Base Path: `/billing`

#### Invoice Management

| Method  | Endpoint                         | Description            | Request Body                           | Response                 |
| ------- | -------------------------------- | ---------------------- | -------------------------------------- | ------------------------ |
| `POST`  | `/billing/invoices`              | Create new invoice     | `CreateInvoiceDto`                     | Created invoice          |
| `GET`   | `/billing/invoices`              | Get all invoices       | Multiple query params, `page`, `limit` | Invoice list (paginated) |
| `GET`   | `/billing/invoices/:id`          | Get invoice by ID      | -                                      | Invoice details          |
| `PATCH` | `/billing/invoices/:id`          | Update invoice         | `UpdateInvoiceDto`                     | Updated invoice          |
| `POST`  | `/billing/invoices/:id/finalize` | Finalize draft invoice | -                                      | Finalized invoice        |
| `POST`  | `/billing/invoices/:id/cancel`   | Cancel invoice         | `{ reason?: string }`                  | Cancelled invoice        |

#### Charge Management

| Method   | Endpoint                                         | Description           | Request Body      | Response        |
| -------- | ------------------------------------------------ | --------------------- | ----------------- | --------------- |
| `POST`   | `/billing/invoices/:id/charges`                  | Add charge to invoice | `CreateChargeDto` | Added charge    |
| `DELETE` | `/billing/invoices/:invoiceId/charges/:chargeId` | Remove charge         | -                 | Success message |

#### Payment Processing

| Method | Endpoint                                | Description          | Request Body | Response          |
| ------ | --------------------------------------- | -------------------- | ------------ | ----------------- |
| `POST` | `/billing/invoices/:id/payments`        | Process payment      | Payment data | Payment processed |
| `GET`  | `/billing/invoices/:id/payment-status`  | Check payment status | -            | Payment status    |
| `GET`  | `/billing/invoices/:id/payment-history` | Get payment history  | -            | Payment history   |
| `POST` | `/billing/payments/:id/refunds`         | Process refund       | Refund data  | Refund processed  |

#### Paystack Integration

| Method | Endpoint                     | Description                  | Request Body       | Response                 |
| ------ | ---------------------------- | ---------------------------- | ------------------ | ------------------------ |
| `POST` | `/billing/paystack/invoices` | Create invoice with Paystack | `CreateInvoiceDto` | Paystack invoice         |
| `GET`  | `/billing/paystack/invoices` | Get Paystack invoices        | `page`, `limit`    | Invoice list (paginated) |
| `GET`  | `/billing/paystack/stats`    | Get Paystack payment stats   | -                  | Payment statistics       |

---

## 5. Admissions & Wards

### Base Path: `/admissions`

#### Admission Management

| Method  | Endpoint                    | Description           | Request Body                           | Response                   |
| ------- | --------------------------- | --------------------- | -------------------------------------- | -------------------------- |
| `POST`  | `/admissions`               | Create new admission  | `CreateAdmissionDto`                   | Created admission          |
| `GET`   | `/admissions`               | Get all admissions    | Multiple query params, `page`, `limit` | Admission list (paginated) |
| `GET`   | `/admissions/active`        | Get active admissions | -                                      | Active admissions          |
| `GET`   | `/admissions/:id`           | Get admission by ID   | -                                      | Admission details          |
| `PATCH` | `/admissions/:id`           | Update admission      | `UpdateAdmissionDto`                   | Updated admission          |
| `POST`  | `/admissions/:id/discharge` | Discharge patient     | Discharge data                         | Discharged                 |

#### Daily Charges

| Method   | Endpoint                                  | Description         | Request Body           | Response        |
| -------- | ----------------------------------------- | ------------------- | ---------------------- | --------------- |
| `POST`   | `/admissions/:admissionId/daily-charges`  | Add daily charge    | `CreateDailyChargeDto` | Added charge    |
| `PATCH`  | `/admissions/daily-charges/:chargeId`     | Update daily charge | Update data            | Updated charge  |
| `DELETE` | `/admissions/:id/daily-charges/:chargeId` | Remove daily charge | -                      | Success message |

#### Ward Management

| Method | Endpoint                                 | Description           | Response          |
| ------ | ---------------------------------------- | --------------------- | ----------------- |
| `GET`  | `/admissions/wards`                      | Get all wards         | Ward list         |
| `GET`  | `/admissions/wards/:wardId/availability` | Get ward availability | Availability data |

---

## 6. Pharmacy Management

### Base Path: `/pharmacy`

#### Medication Management

| Method | Endpoint                    | Description           | Request Body                           | Response                    |
| ------ | --------------------------- | --------------------- | -------------------------------------- | --------------------------- |
| `POST` | `/pharmacy/medications`     | Create new medication | `CreateMedicationDto`                  | Created medication          |
| `GET`  | `/pharmacy/medications`     | Get all medications   | Multiple query params, `page`, `limit` | Medication list (paginated) |
| `GET`  | `/pharmacy/medications/:id` | Get medication by ID  | -                                      | Medication details          |

#### Inventory Management

| Method  | Endpoint                        | Description                 | Request Body                   | Response             |
| ------- | ------------------------------- | --------------------------- | ------------------------------ | -------------------- |
| `POST`  | `/pharmacy/inventory`           | Add medication to inventory | `CreateMedicationInventoryDto` | Added inventory      |
| `PATCH` | `/pharmacy/inventory/:id`       | Update inventory item       | Update data                    | Updated inventory    |
| `GET`   | `/pharmacy/inventory/summary`   | Get inventory summary       | -                              | Inventory summary    |
| `GET`   | `/pharmacy/inventory/low-stock` | Get low stock alerts        | -                              | Low stock alerts     |
| `GET`   | `/pharmacy/inventory/expiring`  | Get expiring medications    | `days`                         | Expiring medications |

#### Prescription Management

| Method  | Endpoint                      | Description             | Request Body                           | Response                      |
| ------- | ----------------------------- | ----------------------- | -------------------------------------- | ----------------------------- |
| `POST`  | `/pharmacy/prescriptions`     | Create new prescription | `CreatePrescriptionDto`                | Created prescription          |
| `GET`   | `/pharmacy/prescriptions`     | Get all prescriptions   | Multiple query params, `page`, `limit` | Prescription list (paginated) |
| `GET`   | `/pharmacy/prescriptions/:id` | Get prescription by ID  | -                                      | Prescription details          |
| `PATCH` | `/pharmacy/prescriptions/:id` | Update prescription     | `UpdatePrescriptionDto`                | Updated prescription          |

#### Dispensing & Billing

| Method | Endpoint                               | Description                     | Request Body            | Response        |
| ------ | -------------------------------------- | ------------------------------- | ----------------------- | --------------- |
| `POST` | `/pharmacy/prescriptions/:id/invoice`  | Create invoice for prescription | -                       | Invoice created |
| `POST` | `/pharmacy/prescriptions/:id/dispense` | Dispense prescription           | `DispenseMedicationDto` | Dispensed       |

---

## 7. Laboratory Services

### Base Path: `/lab`

#### Lab Order Management

| Method  | Endpoint                    | Description            | Request Body                           | Response                   |
| ------- | --------------------------- | ---------------------- | -------------------------------------- | -------------------------- |
| `POST`  | `/lab/orders`               | Create new lab order   | `CreateLabOrderDto`                    | Created lab order          |
| `GET`   | `/lab`                      | Get all lab orders     | Multiple query params, `page`, `limit` | Lab order list (paginated) |
| `GET`   | `/lab/orders/:id`           | Get lab order by ID    | -                                      | Lab order details          |
| `PATCH` | `/lab/orders/:id`           | Update lab order       | `UpdateLabOrderDto`                    | Updated lab order          |
| `POST`  | `/lab/orders/:id/cancel`    | Cancel lab order       | `{ reason?: string }`                  | Cancelled order            |
| `POST`  | `/lab/orders/:id/mark-paid` | Mark lab order as paid | -                                      | Marked as paid             |

#### Lab Test Management

| Method  | Endpoint                      | Description           | Request Body         | Response       |
| ------- | ----------------------------- | --------------------- | -------------------- | -------------- |
| `POST`  | `/lab/orders/:orderId/tests`  | Add test to lab order | `CreateLabTestDto`   | Added test     |
| `PATCH` | `/lab/tests/:testId`          | Update lab test       | `UpdateLabTestDto`   | Updated test   |
| `POST`  | `/lab/tests/:testId/start`    | Start lab test        | -                    | Started test   |
| `POST`  | `/lab/tests/:testId/complete` | Complete lab test     | `CompleteLabTestDto` | Completed test |

#### Enhanced Queries

| Method | Endpoint                                | Description                  | Response         |
| ------ | --------------------------------------- | ---------------------------- | ---------------- |
| `GET`  | `/lab/orders/ready-for-testing`         | Get orders ready for testing | Ready orders     |
| `GET`  | `/lab/orders/payment-status/:isPaid`    | Get orders by payment status | Orders by status |
| `GET`  | `/lab/tests/patient/:patientId/results` | Get patient test results     | Test results     |

---

## 8. Surgical Services

### Base Path: `/surgery`

#### Surgery Management

| Method  | Endpoint                  | Description            | Request Body                           | Response                 |
| ------- | ------------------------- | ---------------------- | -------------------------------------- | ------------------------ |
| `POST`  | `/surgery`                | Create new surgery     | `CreateSurgeryDto`                     | Created surgery          |
| `GET`   | `/surgery`                | Get all surgeries      | Multiple query params, `page`, `limit` | Surgery list (paginated) |
| `GET`   | `/surgery/upcoming`       | Get upcoming surgeries | -                                      | Upcoming surgeries       |
| `GET`   | `/surgery/:id`            | Get surgery by ID      | -                                      | Surgery details          |
| `PATCH` | `/surgery/:id`            | Update surgery         | `UpdateSurgeryDto`                     | Updated surgery          |
| `POST`  | `/surgery/:id/cancel`     | Cancel surgery         | `{ reason?: string }`                  | Cancelled surgery        |
| `POST`  | `/surgery/:id/reschedule` | Reschedule surgery     | Reschedule data                        | Rescheduled surgery      |

#### Surgery Status Management

| Method | Endpoint                | Description      | Request Body         | Response          |
| ------ | ----------------------- | ---------------- | -------------------- | ----------------- |
| `POST` | `/surgery/:id/start`    | Start surgery    | -                    | Started surgery   |
| `POST` | `/surgery/:id/complete` | Complete surgery | `{ notes?: string }` | Completed surgery |

#### Enhanced Features

| Method | Endpoint                       | Description               | Request Body                    | Response        |
| ------ | ------------------------------ | ------------------------- | ------------------------------- | --------------- |
| `POST` | `/surgery/:id/procedures`      | Add surgical procedure    | `CreateSurgicalProcedureDto`    | Added procedure |
| `POST` | `/surgery/:id/book-room`       | Book operating room       | `CreateOperatingRoomBookingDto` | Room booked     |
| `GET`  | `/surgery/:id/billing-details` | Get detailed billing info | -                               | Billing details |

---

## 9. Consultations

### Base Path: `/consultations`

| Method  | Endpoint                      | Description             | Request Body                           | Response                      |
| ------- | ----------------------------- | ----------------------- | -------------------------------------- | ----------------------------- |
| `POST`  | `/consultations`              | Create new consultation | `CreateConsultationDto`                | Created consultation          |
| `GET`   | `/consultations`              | Get all consultations   | Multiple query params, `page`, `limit` | Consultation list (paginated) |
| `GET`   | `/consultations/:id`          | Get consultation by ID  | -                                      | Consultation details          |
| `PATCH` | `/consultations/:id`          | Update consultation     | `UpdateConsultationDto`                | Updated consultation          |
| `POST`  | `/consultations/:id/complete` | Complete consultation   | Completion data                        | Completed consultation        |
| `POST`  | `/consultations/:id/cancel`   | Cancel consultation     | `{ reason?: string }`                  | Cancelled consultation        |

#### Schedule & History

| Method | Endpoint                                     | Description                      | Query Parameters | Response             |
| ------ | -------------------------------------------- | -------------------------------- | ---------------- | -------------------- |
| `GET`  | `/consultations/doctors/:doctorId/schedule`  | Get doctor schedule              | `date`           | Doctor schedule      |
| `GET`  | `/consultations/patients/:patientId/history` | Get patient consultation history | -                | Consultation history |

---

## 10. Services & Pricing

### Base Path: `/services`

#### Service Categories

| Method   | Endpoint                   | Description                | Request Body               | Response         |
| -------- | -------------------------- | -------------------------- | -------------------------- | ---------------- |
| `POST`   | `/services/categories`     | Create service category    | `CreateServiceCategoryDto` | Created category |
| `GET`    | `/services/categories`     | Get all service categories | -                          | Category list    |
| `GET`    | `/services/categories/:id` | Get category by ID         | -                          | Category details |
| `PATCH`  | `/services/categories/:id` | Update category            | `UpdateServiceCategoryDto` | Updated category |
| `DELETE` | `/services/categories/:id` | Deactivate category        | -                          | Success message  |

#### Services

| Method   | Endpoint              | Description          | Request Body                           | Response                 |
| -------- | --------------------- | -------------------- | -------------------------------------- | ------------------------ |
| `POST`   | `/services`           | Create new service   | `CreateServiceDto`                     | Created service          |
| `GET`    | `/services`           | Get all services     | Multiple query params, `page`, `limit` | Service list (paginated) |
| `GET`    | `/services/:id`       | Get service by ID    | -                                      | Service details          |
| `PATCH`  | `/services/:id`       | Update service       | `UpdateServiceDto`                     | Updated service          |
| `DELETE` | `/services/:id`       | Deactivate service   | -                                      | Success message          |
| `PATCH`  | `/services/:id/price` | Update service price | `UpdateServicePriceDto`                | Updated price            |

---

## 11. Payment Processing

### Base Path: `/payments`

#### Payment Management

| Method  | Endpoint        | Description        | Request Body                           | Response                 |
| ------- | --------------- | ------------------ | -------------------------------------- | ------------------------ |
| `POST`  | `/payments`     | Create new payment | `CreatePaymentDto`                     | Created payment          |
| `GET`   | `/payments`     | Get all payments   | Multiple query params, `page`, `limit` | Payment list (paginated) |
| `GET`   | `/payments/:id` | Get payment by ID  | -                                      | Payment details          |
| `PATCH` | `/payments/:id` | Update payment     | `UpdatePaymentDto`                     | Updated payment          |

#### Refund Management

| Method | Endpoint                              | Description           | Request Body             | Response        |
| ------ | ------------------------------------- | --------------------- | ------------------------ | --------------- |
| `POST` | `/payments/refunds`                   | Create refund request | `CreateRefundDto`        | Created refund  |
| `POST` | `/payments/refunds/:refundId/approve` | Approve refund        | `{ approvedBy: string }` | Approved refund |
| `POST` | `/payments/refunds/:refundId/reject`  | Reject refund         | Rejection data           | Rejected refund |

#### Enhanced Features

| Method | Endpoint                          | Description                   | Response              |
| ------ | --------------------------------- | ----------------------------- | --------------------- |
| `GET`  | `/payments/verify/:invoiceId`     | Verify payment before service | Verification result   |
| `GET`  | `/payments/methods-breakdown`     | Get payment methods breakdown | Methods breakdown     |
| `GET`  | `/payments/reconciliation-report` | Get reconciliation report     | Reconciliation report |
| `GET`  | `/payments/analytics`             | Get payment analytics         | Payment analytics     |

---

## 12. Cash Office Integration

### Base Path: `/cash-office`

#### Cash Transaction Management

| Method  | Endpoint                        | Description               | Request Body                           | Response                     |
| ------- | ------------------------------- | ------------------------- | -------------------------------------- | ---------------------------- |
| `POST`  | `/cash-office/transactions`     | Create cash transaction   | `CreateCashTransactionDto`             | Created transaction          |
| `GET`   | `/cash-office/transactions`     | Get all cash transactions | Multiple query params, `page`, `limit` | Transaction list (paginated) |
| `GET`   | `/cash-office/transactions/:id` | Get transaction by ID     | -                                      | Transaction details          |
| `PATCH` | `/cash-office/transactions/:id` | Update transaction        | `UpdateCashTransactionDto`             | Updated transaction          |

#### Petty Cash Management

| Method | Endpoint                              | Description                | Request Body             | Response         |
| ------ | ------------------------------------- | -------------------------- | ------------------------ | ---------------- |
| `POST` | `/cash-office/petty-cash`             | Create petty cash request  | `CreatePettyCashDto`     | Created request  |
| `POST` | `/cash-office/petty-cash/:id/approve` | Approve petty cash request | `{ approverId: string }` | Approved request |
| `POST` | `/cash-office/petty-cash/:id/reject`  | Reject petty cash request  | Rejection data           | Rejected request |

#### Payment Processing Integration

| Method | Endpoint                                    | Description                 | Request Body | Response          |
| ------ | ------------------------------------------- | --------------------------- | ------------ | ----------------- |
| `POST` | `/cash-office/invoices/:id/payments`        | Process invoice payment     | Payment data | Payment processed |
| `GET`  | `/cash-office/invoices/:id/payment-status`  | Check payment status        | -            | Payment status    |
| `GET`  | `/cash-office/invoices/:id/payment-history` | Get invoice payment history | -            | Payment history   |

---

## 13. Paystack Integration

### Base Path: `/paystack`

| Method | Endpoint                         | Description              | Request Body                 | Response         |
| ------ | -------------------------------- | ------------------------ | ---------------------------- | ---------------- |
| `POST` | `/paystack/webhook`              | Handle Paystack webhooks | Webhook payload              | Success status   |
| `POST` | `/paystack/invoices`             | Create Paystack invoice  | Invoice data                 | Created invoice  |
| `POST` | `/paystack/invoices/:invoiceId`  | Get Paystack invoice     | `{ localInvoiceId: string }` | Invoice details  |
| `POST` | `/paystack/customers/:patientId` | Get Paystack customer    | `{ patientId: string }`      | Customer details |

---

## 14. Service Providers

### Base Path: `/staff/service-providers`

#### Service Provider Management

| Method  | Endpoint                                                  | Description                             | Query Parameters                                            | Response                          |
| ------- | --------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `GET`   | `/staff/service-providers`                                | Get all service providers               | `search`, `departmentId`, `specialization`, `page`, `limit` | Service provider list (paginated) |
| `GET`   | `/staff/service-providers/stats`                          | Get service provider statistics         | -                                                           | Service provider statistics       |
| `GET`   | `/staff/service-providers/department/:id`                 | Get service providers by department     | -                                                           | Department service providers      |
| `GET`   | `/staff/service-providers/specialization/:specialization` | Get service providers by specialization | -                                                           | Specialized service providers     |
| `PATCH` | `/staff/:id/service-provider-status`                      | Update service provider status          | `{ serviceProvider: boolean }`                              | Updated staff member              |

#### Provider Service Validation

| Method | Endpoint                                                           | Description                         | Request Body | Response                |
| ------ | ------------------------------------------------------------------ | ----------------------------------- | ------------ | ----------------------- |
| `GET`  | `/appointments/providers/:providerId/services`                     | Get services available to provider  | -            | Available services list |
| `POST` | `/appointments/providers/:providerId/services/:serviceId/validate` | Validate provider access to service | -            | Validation result       |

---

## 15. Reporting & Analytics

### Base Path: `/reporting`

#### Core Reports

| Method | Endpoint                            | Description                | Query Parameters       | Response            |
| ------ | ----------------------------------- | -------------------------- | ---------------------- | ------------------- |
| `GET`  | `/reporting/revenue`                | Get revenue report         | `startDate`, `endDate` | Revenue report      |
| `GET`  | `/reporting/department-performance` | Get department performance | `startDate`, `endDate` | Performance report  |
| `GET`  | `/reporting/patient-analytics`      | Get patient analytics      | `startDate`, `endDate` | Patient analytics   |
| `GET`  | `/reporting/service-performance`    | Get service performance    | `startDate`, `endDate` | Service performance |

#### Quick Reports

| Method | Endpoint                        | Description             | Response      |
| ------ | ------------------------------- | ----------------------- | ------------- |
| `GET`  | `/reporting/quick/last-30-days` | Get last 30 days report | 30-day report |
| `GET`  | `/reporting/quick/last-90-days` | Get last 90 days report | 90-day report |
| `GET`  | `/reporting/quick/last-year`    | Get last year report    | 1-year report |

#### Enhanced Analytics

| Method | Endpoint                              | Description                         | Query Parameters       | Response           |
| ------ | ------------------------------------- | ----------------------------------- | ---------------------- | ------------------ |
| `GET`  | `/reporting/cross-module-integration` | Get cross-module integration report | `startDate`, `endDate` | Integration report |
| `GET`  | `/reporting/payment-analytics`        | Get payment analytics report        | `startDate`, `endDate` | Payment analytics  |
| `GET`  | `/reporting/financial-forecast`       | Get financial forecast report       | `months`               | Forecast report    |

---

## Common Query Parameters

Most endpoints support these common query parameters:

- `startDate`: Start date (YYYY-MM-DD format)
- `endDate`: End date (YYYY-MM-DD format)
- `search`: Search term for names, IDs, or descriptions
- `status`: Filter by status

## Pagination Support

The following endpoints support pagination with `page` and `limit` query parameters:

- `GET /users` - User listing with role, status, and search filters
- `GET /patients` - Patient listing with search and status filters
- `GET /billing/invoices` - Invoice listing with multiple filters
- `GET /admissions` - Admission listing with comprehensive filters
- `GET /pharmacy/medications` - Medication listing with category and search filters
- `GET /pharmacy/prescriptions` - Prescription listing with multiple filters
- `GET /lab` - Lab order listing with comprehensive filters
- `GET /surgery` - Surgery listing with multiple filters
- `GET /consultations` - Consultation listing with comprehensive filters
- `GET /services` - Service listing with category and status filters
- `GET /payments` - Payment listing with comprehensive filters
- `GET /cash-office/transactions` - Cash transaction listing with multiple filters

**Pagination Parameters:**

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20, max: 100)

---

## HTTP Status Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 200  | OK - Request successful                 |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid input data        |
| 401  | Unauthorized - Authentication required  |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource not found          |
| 409  | Conflict - Resource conflict            |
| 500  | Internal Server Error - Server error    |

---

## Authentication & Authorization

### JWT Token Format

```
Authorization: Bearer <jwt-token>
```

### Required Roles

- **Admin**: Full access to all endpoints
- **Doctor**: Access to patient data, consultations, prescriptions
- **Nurse**: Access to patient data, admissions, basic billing
- **Cashier**: Access to billing, payments, cash office
- **Lab Technician**: Access to laboratory services
- **Pharmacist**: Access to pharmacy services

---

## Support & Documentation

- **API Documentation**: Swagger UI available at `/api-docs`
- **Health Check**: Available at `/health`
- **Version Information**: Available at `/version`

---

_This documentation covers all endpoints available in the Hospital Billing Backend API. For detailed request/response schemas, refer to the Swagger documentation or individual DTO files._
