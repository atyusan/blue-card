# Paystack Integration Test Guide

## 🧪 Testing the Integration

### Prerequisites

1. Set up environment variables in `.env`:

```bash
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

2. Ensure the application is running:

```bash
npm run start:dev
```

### 🧪 Test Scenarios

#### 1. Test Customer Creation

```bash
# Create a Paystack customer for a patient
curl -X POST http://localhost:3000/paystack/customers/patient-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId": "patient-123"}'
```

#### 2. Test Invoice Creation

```bash
# Create invoice with Paystack integration
curl -X POST http://localhost:3000/paystack/invoices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "amount": 5000,
    "description": "Consultation and lab tests",
    "lineItems": [
      {"name": "General Consultation", "amount": 2000, "quantity": 1},
      {"name": "Blood Test", "amount": 3000, "quantity": 1}
    ]
  }'
```

#### 3. Test Enhanced Billing Endpoints

```bash
# Create invoice via billing service
curl -X POST http://localhost:3000/billing/paystack/invoices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "totalAmount": 5000,
    "notes": "Consultation and lab tests"
  }'
```

#### 4. Test Webhook Endpoint

```bash
# Test webhook signature verification
curl -X POST http://localhost:3000/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test_signature" \
  -d '{
    "event": "paymentrequest.success",
    "data": {
      "request_code": "PRQ_test123",
      "amount": 5000,
      "offline_reference": "test_ref"
    }
  }'
```

### 🔍 Expected Results

#### Customer Creation

- Should create Paystack customer if patient doesn't have one
- Should return existing customer if already exists
- Should store customer reference in database

#### Invoice Creation

- Should create local invoice
- Should create Paystack invoice
- Should link both invoices together
- Should return combined invoice data

#### Webhook Processing

- Should verify signature (will fail with test signature)
- Should process valid webhook events
- Should update invoice statuses
- Should create payment records

### 🚨 Common Issues & Solutions

#### 1. Missing Environment Variables

```
Error: PAYSTACK_SECRET_KEY is required
```

**Solution**: Add Paystack keys to `.env` file

#### 2. Invalid Webhook Signature

```
Error: Invalid signature
```

**Solution**: Use proper HMAC SHA512 signature from Paystack

#### 3. Patient Not Found

```
Error: Patient not found
```

**Solution**: Ensure patient exists in database before creating invoice

#### 4. Paystack API Errors

```
Error: Failed to create Paystack customer/invoice
```

**Solution**: Check Paystack API keys and account status

### 📊 Monitoring

#### Check Database

```sql
-- View Paystack customers
SELECT * FROM paystack_customers;

-- View Paystack invoices
SELECT * FROM paystack_invoices;

-- View linked invoices
SELECT i.*, pi.paystackInvoiceId, pi.requestCode
FROM invoices i
JOIN paystack_invoices pi ON i.id = pi.localInvoiceId;
```

#### Check Logs

- Monitor application logs for Paystack API calls
- Check webhook processing logs
- Monitor error logs for failed operations

### 🔐 Security Testing

#### 1. Test Invalid Signatures

```bash
# Test with missing signature
curl -X POST http://localhost:3000/paystack/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {}}'

# Test with invalid signature
curl -X POST http://localhost:3000/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: invalid_signature" \
  -d '{"event": "test", "data": {}}'
```

#### 2. Test Authentication

```bash
# Test without JWT token
curl -X POST http://localhost:3000/paystack/invoices \
  -H "Content-Type: application/json" \
  -d '{"patientId": "test", "amount": 1000}'
```

### 🎯 Success Criteria

✅ **Customer Management**

- Customers created automatically on first invoice
- Existing customers retrieved without duplication
- Customer data properly stored and linked

✅ **Invoice Integration**

- Local invoices created successfully
- Paystack invoices created and linked
- Line items properly formatted
- References stored correctly

✅ **Webhook Processing**

- Signature verification working
- Events processed correctly
- Database updates successful
- Payment records created

✅ **Error Handling**

- API failures handled gracefully
- Invalid webhooks rejected
- Missing data handled properly
- Logging comprehensive

### 🚀 Next Steps

1. **Production Testing**
   - Test with real Paystack test keys
   - Verify webhook delivery
   - Test payment flows

2. **Integration Testing**
   - Test with existing billing system
   - Verify data consistency
   - Test error scenarios

3. **Performance Testing**
   - Load test webhook endpoint
   - Monitor API response times
   - Test concurrent operations

---

**Note**: This is a development testing guide. For production deployment, ensure proper security measures, monitoring, and error handling are in place.
