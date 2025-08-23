# Paystack Terminal Integration

## Overview

This module integrates Paystack Terminal with your hospital billing system, allowing patients to pay invoices using Paystack's terminal devices. The integration follows a three-step process: create customer, create invoice, and handle webhook events.

## 🚀 Features

### Core Integration

- **Customer Management**: Automatically create Paystack customers when patients get their first invoice
- **Invoice Creation**: Generate Paystack invoices for all local invoices
- **Webhook Processing**: Handle payment confirmations, failures, and status updates
- **Real-time Sync**: Keep local and Paystack invoice statuses synchronized

### Security Features

- **Webhook Signature Verification**: Ensures webhook authenticity
- **JWT Authentication**: Protected endpoints for invoice creation
- **Error Handling**: Graceful handling of API failures and webhook errors

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

### Webhook URL Configuration

In your Paystack dashboard, set the webhook URL to:

```
https://your-domain.com/paystack/webhook
```

## 📊 Database Models

### PaystackCustomer

- Links patients to Paystack customers
- Stores customer codes and metadata
- One-to-one relationship with patients

### PaystackInvoice

- Tracks Paystack invoice details
- Links to local invoices
- Stores payment status and references

## 🔌 API Endpoints

### Webhook Endpoint

```
POST /paystack/webhook
```

- Receives all Paystack webhook events
- Verifies signature for security
- Processes payment confirmations and failures

### Invoice Management

```
POST /paystack/invoices
```

- Create invoice with Paystack integration
- Requires authentication
- Automatically creates Paystack customer if needed

```
GET /paystack/invoices
```

- List all Paystack invoices with pagination

```
GET /paystack/invoices/:id
```

- Get detailed Paystack invoice information

```
GET /paystack/stats
```

- Get Paystack payment statistics

### Enhanced Billing Endpoints

```
POST /billing/paystack/invoices
```

- Create invoice with Paystack integration
- Includes line items for detailed billing

```
GET /billing/paystack/invoices
```

- List Paystack invoices with billing details

```
GET /billing/paystack/stats
```

- Get comprehensive Paystack payment analytics

## 🔄 Integration Flow

### 1. Customer Creation

```
Patient gets first invoice → Check if Paystack customer exists → Create customer if needed → Store customer reference
```

### 2. Invoice Creation

```
Local invoice created → Get/create Paystack customer → Create Paystack invoice → Store references → Listen for webhook
```

### 3. Payment Processing

```
Webhook received → Verify signature → Update local invoice status → Create payment record → Update patient balance
```

## 📡 Webhook Events Handled

### charge.success

- Payment completed successfully
- Updates payment status
- Creates payment record

### paymentrequest.success

- Invoice payment confirmed
- Updates invoice status to PAID
- Creates payment record

### paymentrequest.pending

- Invoice created, waiting for payment
- Updates invoice status to PENDING

### invoice.payment_failed

- Payment attempt failed
- Updates invoice status to FAILED

## 🛠️ Usage Examples

### Create Invoice with Paystack

```typescript
// Create invoice with line items
const invoice = await billingService.createInvoiceWithPaystack(
  {
    patientId: 'patient-123',
    totalAmount: 5000,
    notes: 'Consultation and lab tests',
  },
  [
    { name: 'General Consultation', amount: 2000, quantity: 1 },
    { name: 'Blood Test', amount: 3000, quantity: 1 },
  ],
);
```

### Get Paystack Statistics

```typescript
const stats = await billingService.getPaystackPaymentStats();
// Returns: totalInvoices, paidInvoices, pendingInvoices, totalAmount, paidAmount, pendingAmount
```

## 🔒 Security Considerations

### Webhook Verification

- All webhooks are verified using HMAC SHA512
- Invalid signatures are rejected
- Missing signatures trigger warnings

### Authentication

- Invoice creation requires JWT authentication
- Customer data is protected
- Payment information is encrypted

### Error Handling

- API failures are logged and handled gracefully
- Webhook processing errors don't affect system stability
- Failed operations can be retried

## 📈 Monitoring & Analytics

### Payment Statistics

- Total Paystack invoices
- Payment success rates
- Revenue tracking
- Pending payment amounts

### Webhook Monitoring

- Event processing logs
- Signature verification results
- Payment status updates
- Error tracking

## 🚨 Troubleshooting

### Common Issues

#### Webhook Not Receiving Events

1. Check webhook URL configuration in Paystack dashboard
2. Verify server is accessible from internet
3. Check webhook signature verification

#### Invoice Creation Fails

1. Verify Paystack API keys are correct
2. Check patient data completeness
3. Ensure sufficient API rate limits

#### Payment Status Not Syncing

1. Verify webhook endpoint is working
2. Check database connection
3. Review webhook processing logs

### Debug Mode

Enable detailed logging by setting log level to DEBUG in your application configuration.

## 🔮 Future Enhancements

### Planned Features

- **Bulk Invoice Creation**: Process multiple invoices at once
- **Advanced Analytics**: Payment trends and forecasting
- **Multi-terminal Support**: Handle multiple terminal devices
- **Offline Payment Sync**: Handle offline payment scenarios
- **Payment Reconciliation**: Automated payment matching

### Integration Opportunities

- **SMS Notifications**: Payment reminders via SMS
- **Email Integration**: Invoice delivery via email
- **Mobile App**: Patient payment portal
- **Reporting Dashboard**: Real-time payment analytics

## 📚 API Documentation

### Paystack API References

- [Customer API](https://paystack.com/docs/api/customer/)
- [Payment Request API](https://paystack.com/docs/api/payment-request/)
- [Webhook Events](https://paystack.com/docs/api/webhooks/)

### Local API Documentation

- [Billing API](./billing/README.md)
- [Payment API](./payments/README.md)
- [Patient API](./patients/README.md)

## 🤝 Support

### Technical Support

- Check application logs for detailed error information
- Verify Paystack dashboard for webhook delivery status
- Review database for data consistency

### Paystack Support

- [Paystack Documentation](https://paystack.com/docs)
- [Paystack Support](https://paystack.com/support)
- [API Status](https://status.paystack.com)

---

**Note**: This integration requires an active Paystack account with terminal capabilities enabled. Ensure your Paystack account is properly configured and has sufficient permissions for the required API endpoints.
