import { PrismaService } from '../database/prisma.service';
import { NotificationChannel } from '@prisma/client';

export async function seedNotificationTemplates(prisma: PrismaService) {
  console.log('Seeding notification templates...');

  const templates = [
    // Appointment Confirmation Email
    {
      name: 'appointment_confirmation',
      type: 'APPOINTMENT_CONFIRMATION',
      channel: NotificationChannel.EMAIL,
      subject: 'Appointment Confirmation - {{appointmentDate}}',
      content: `
Dear {{patientName}},

Your appointment has been confirmed for {{appointmentDate}} at {{appointmentTime}}.

**Appointment Details:**
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Provider: {{providerName}}
- Location: {{resourceName}} - {{resourceLocation}}
- Type: {{appointmentType}}
- Total Amount: {{totalAmount}}

**Important Information:**
- Please arrive 15 minutes before your scheduled time
- Bring your ID and insurance information
- Payment is required before services are provided
- Call us at least 24 hours in advance if you need to reschedule

**Contact Information:**
- Phone: (555) 123-4567
- Email: appointments@hospital.com
- Address: 123 Medical Center Dr, Healthcare City

We look forward to seeing you!

Best regards,
Hospital Staff
      `,
      variables: [
        'patientName',
        'appointmentDate',
        'appointmentTime',
        'providerName',
        'resourceName',
        'resourceLocation',
        'appointmentType',
        'totalAmount',
      ],
      isActive: true,
    },

    // Appointment Confirmation SMS
    {
      name: 'appointment_confirmation_sms',
      type: 'APPOINTMENT_CONFIRMATION',
      channel: NotificationChannel.SMS,
      subject: '',
      content: `Hi {{patientName}}, your appointment is confirmed for {{appointmentDate}} at {{appointmentTime}} with {{providerName}}. Location: {{resourceName}}. Total: {{totalAmount}}. Call (555) 123-4567 for changes.`,
      variables: [
        'patientName',
        'appointmentDate',
        'appointmentTime',
        'providerName',
        'resourceName',
        'totalAmount',
      ],
      isActive: true,
    },

    // 24-Hour Reminder SMS
    {
      name: 'appointment_reminder_24hr',
      type: 'APPOINTMENT_REMINDER',
      channel: NotificationChannel.SMS,
      subject: '',
      content: `Reminder: Your appointment is tomorrow at {{appointmentTime}} with {{providerName}}. Please confirm by replying YES or call (555) 123-4567 to cancel.`,
      variables: [
        'patientName',
        'appointmentDate',
        'appointmentTime',
        'providerName',
        'reminderType',
      ],
      isActive: true,
    },

    // 2-Hour Reminder SMS
    {
      name: 'appointment_reminder_2hr',
      type: 'APPOINTMENT_REMINDER',
      channel: NotificationChannel.SMS,
      subject: '',
      content: `Your appointment is in 2 hours at {{appointmentTime}} with {{providerName}}. Please arrive 15 minutes early. Call (555) 123-4567 if you need to reschedule.`,
      variables: [
        'patientName',
        'appointmentDate',
        'appointmentTime',
        'providerName',
        'reminderType',
      ],
      isActive: true,
    },

    // 1-Hour Reminder SMS
    {
      name: 'appointment_reminder_1hr',
      type: 'APPOINTMENT_REMINDER',
      channel: NotificationChannel.SMS,
      subject: '',
      content: `Your appointment is in 1 hour at {{appointmentTime}} with {{providerName}}. Please arrive soon. We're looking forward to seeing you!`,
      variables: [
        'patientName',
        'appointmentDate',
        'appointmentTime',
        'providerName',
        'reminderType',
      ],
      isActive: true,
    },

    // Payment Reminder Email
    {
      name: 'payment_reminder',
      type: 'PAYMENT_REMINDER',
      channel: NotificationChannel.EMAIL,
      subject: 'Payment Reminder - Outstanding Balance for {{appointmentDate}}',
      content: `
Dear {{patientName}},

This is a friendly reminder that you have an outstanding balance for your appointment on {{appointmentDate}}.

**Payment Details:**
- Appointment Date: {{appointmentDate}}
- Total Amount: {{totalAmount}}
- Outstanding Balance: {{balance}}
- Due Date: {{dueDate}}

**Payment Options:**
- Online: Visit our patient portal
- Phone: Call (555) 123-4567
- In Person: Visit our billing office
- Mail: Send check to our billing address

**Important:**
- Payment is required before services are provided
- Failure to pay may result in appointment cancellation
- Contact us if you need to discuss payment arrangements

**Contact Information:**
- Billing Phone: (555) 123-4567
- Billing Email: billing@hospital.com
- Patient Portal: patient.hospital.com

Thank you for your prompt attention to this matter.

Best regards,
Hospital Billing Department
      `,
      variables: [
        'patientName',
        'appointmentDate',
        'totalAmount',
        'balance',
        'dueDate',
      ],
      isActive: true,
    },

    // Payment Confirmation Email
    {
      name: 'payment_confirmation',
      type: 'PAYMENT_RECEIVED',
      channel: NotificationChannel.EMAIL,
      subject: 'Payment Confirmation - {{amount}} Received',
      content: `
Dear {{patientName}},

Thank you for your payment of {{amount}} for your appointment on {{appointmentDate}}.

**Payment Details:**
- Appointment Date: {{appointmentDate}}
- Payment Amount: {{amount}}
- Total Amount: {{totalAmount}}
- Remaining Balance: {{balance}}
- Payment Method: {{paymentMethod}}

**Next Steps:**
- Your appointment is confirmed
- Please arrive 15 minutes before your scheduled time
- Bring your ID and any required documentation

**Contact Information:**
- Phone: (555) 123-4567
- Email: appointments@hospital.com

We appreciate your business and look forward to providing you with excellent care.

Best regards,
Hospital Staff
      `,
      variables: [
        'patientName',
        'appointmentDate',
        'amount',
        'totalAmount',
        'balance',
        'paymentMethod',
      ],
      isActive: true,
    },

    // Appointment Cancellation Email
    {
      name: 'appointment_cancellation',
      type: 'APPOINTMENT_CANCELLATION',
      channel: NotificationChannel.EMAIL,
      subject: 'Appointment Cancellation - {{appointmentDate}}',
      content: `
Dear {{patientName}},

Your appointment scheduled for {{appointmentDate}} at {{appointmentTime}} has been cancelled.

**Cancellation Details:**
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Provider: {{providerName}}
- Reason: {{cancellationReason}}

**Rescheduling:**
- To reschedule, please call (555) 123-4567
- Visit our patient portal to book online
- We'll do our best to accommodate your schedule

**Refund Information:**
- If you've already paid, a refund will be processed
- Refunds typically take 5-7 business days
- Contact billing for any questions about refunds

**Contact Information:**
- Appointments: (555) 123-4567
- Billing: (555) 123-4567
- Email: appointments@hospital.com

We apologize for any inconvenience and hope to see you soon.

Best regards,
Hospital Staff
      `,
      variables: [
        'patientName',
        'appointmentDate',
        'appointmentTime',
        'providerName',
        'cancellationReason',
      ],
      isActive: true,
    },

    // Appointment Reschedule Email
    {
      name: 'appointment_reschedule',
      type: 'APPOINTMENT_RESCHEDULE',
      channel: NotificationChannel.EMAIL,
      subject: 'Appointment Rescheduled - New Date: {{newAppointmentDate}}',
      content: `
Dear {{patientName}},

Your appointment has been rescheduled to {{newAppointmentDate}} at {{newAppointmentTime}}.

**New Appointment Details:**
- Date: {{newAppointmentDate}}
- Time: {{newAppointmentTime}}
- Provider: {{providerName}}
- Location: {{resourceName}} - {{resourceLocation}}

**Previous Appointment:**
- Date: {{oldAppointmentDate}}
- Time: {{oldAppointmentTime}}

**Reschedule Reason:**
{{rescheduleReason}}

**Important Information:**
- Please arrive 15 minutes before your new scheduled time
- Bring your ID and insurance information
- Payment is required before services are provided

**Contact Information:**
- Phone: (555) 123-4567
- Email: appointments@hospital.com

We apologize for any inconvenience and look forward to seeing you at your new appointment time.

Best regards,
Hospital Staff
      `,
      variables: [
        'patientName',
        'newAppointmentDate',
        'newAppointmentTime',
        'oldAppointmentDate',
        'oldAppointmentTime',
        'providerName',
        'resourceName',
        'resourceLocation',
        'rescheduleReason',
      ],
      isActive: true,
    },

    // Pre-Visit Instructions Email
    {
      name: 'pre_visit_instructions',
      type: 'PRE_VISIT_INSTRUCTIONS',
      channel: NotificationChannel.EMAIL,
      subject: 'Pre-Visit Instructions for {{appointmentDate}}',
      content: `
Dear {{patientName}},

Here are your pre-visit instructions for your appointment on {{appointmentDate}} at {{appointmentTime}}.

**Appointment Details:**
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Provider: {{providerName}}
- Location: {{resourceName}} - {{resourceLocation}}

**Pre-Visit Instructions:**
{{preVisitInstructions}}

**What to Bring:**
- Photo ID
- Insurance card
- List of current medications
- Any relevant medical records
- Payment method (if not pre-paid)

**Arrival Time:**
- Please arrive 15 minutes before your scheduled appointment
- This allows time for check-in and paperwork

**Parking:**
- Free parking available in the main lot
- Handicap accessible parking near the main entrance

**Contact Information:**
- Phone: (555) 123-4567
- Email: appointments@hospital.com

If you have any questions, please don't hesitate to contact us.

Best regards,
Hospital Staff
      `,
      variables: [
        'patientName',
        'appointmentDate',
        'appointmentTime',
        'providerName',
        'resourceName',
        'resourceLocation',
        'preVisitInstructions',
      ],
      isActive: true,
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
  }

  console.log(`Seeded ${templates.length} notification templates`);
}
