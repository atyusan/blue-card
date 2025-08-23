import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus, RequestUrgency } from './cash-request.enums';

export { RequestStatus, RequestUrgency };

export class CashRequest {
  @ApiProperty({
    description: 'Unique identifier for the cash request',
    example: 'cmeol9d0u00031dbojjh7udef',
  })
  id: string;

  @ApiProperty({
    description: 'Auto-generated request number',
    example: 'CR-20250823-001',
  })
  requestNumber: string;

  @ApiProperty({
    description: 'ID of the staff member requesting cash',
    example: 'cmem3u6vx000g1dpv68lmut2u',
  })
  requesterId: string;

  @ApiProperty({
    description: 'Department making the request',
    example: 'Finance',
  })
  department: string;

  @ApiProperty({
    description: 'Purpose of the cash request',
    example: 'Office supplies purchase',
  })
  purpose: string;

  @ApiProperty({
    description: 'Amount requested',
    example: 150.0,
  })
  amount: number;

  @ApiProperty({
    description: 'Urgency level of the request',
    enum: RequestUrgency,
    example: RequestUrgency.NORMAL,
  })
  urgency: RequestUrgency;

  @ApiProperty({
    description: 'Current status of the request',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @ApiProperty({
    description: 'ID of the staff member who approved the request',
    example: 'cmem3u6vx000g1dpv68lmut2u',
    required: false,
  })
  approvedBy?: string;

  @ApiProperty({
    description: 'Date when the request was approved',
    example: '2025-08-23T18:24:19.758Z',
    required: false,
  })
  approvedAt?: Date;

  @ApiProperty({
    description: 'Reason for rejection if the request was rejected',
    example: 'Amount exceeds budget limit',
    required: false,
  })
  rejectionReason?: string;

  @ApiProperty({
    description: 'ID of the staff member who rejected the request',
    example: 'cmem3u6vx000g1dpv68lmut2u',
    required: false,
  })
  rejectedBy?: string;

  @ApiProperty({
    description: 'Date when the request was rejected',
    example: '2025-08-23T18:24:19.758Z',
    required: false,
  })
  rejectedAt?: Date;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Need to purchase printer cartridges',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'File attachments (file paths/URLs)',
    type: [String],
    example: ['/uploads/receipt1.pdf', '/uploads/quote1.pdf'],
    required: false,
  })
  attachments?: string[];

  @ApiProperty({
    description: 'Date when the request was created',
    example: '2025-08-23T18:24:19.758Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the request was last updated',
    example: '2025-08-23T18:24:19.758Z',
  })
  updatedAt: Date;

  // Relations
  @ApiProperty({
    description: 'Staff member who made the request',
    type: 'object',
    additionalProperties: true,
  })
  requester?: any;

  @ApiProperty({
    description: 'Staff member who approved the request',
    type: 'object',
    additionalProperties: true,
  })
  approver?: any;

  @ApiProperty({
    description: 'Staff member who rejected the request',
    type: 'object',
    additionalProperties: true,
  })
  rejector?: any;

  @ApiProperty({
    description: 'Cash transactions related to this request',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  cashTransactions?: any[];
}
