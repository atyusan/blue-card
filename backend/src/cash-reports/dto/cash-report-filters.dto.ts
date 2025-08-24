import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CashReportFiltersDto {
  @ApiProperty({
    required: false,
    description: 'Start date for the report (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date for the report (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Department to filter by' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    required: false,
    description: 'Transaction type to filter by',
  })
  @IsOptional()
  @IsString()
  transactionType?: string;

  @ApiProperty({ required: false, description: 'Payment method to filter by' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ required: false, description: 'Status to filter by' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class DepartmentStatsDto {
  @ApiProperty({ description: 'Department name' })
  department: string;

  @ApiProperty({ description: 'Total amount for the department' })
  totalAmount: number;

  @ApiProperty({ description: 'Number of transactions for the department' })
  transactionCount: number;

  @ApiProperty({ description: 'Revenue for the department' })
  revenue: number;

  @ApiProperty({ description: 'Expenses for the department' })
  expenses: number;
}

export class PaymentMethodStatsDto {
  @ApiProperty({ description: 'Payment method name' })
  method: string;

  @ApiProperty({ description: 'Total amount for the payment method' })
  totalAmount: number;

  @ApiProperty({ description: 'Number of transactions for the payment method' })
  transactionCount: number;

  @ApiProperty({ description: 'Percentage of total transactions' })
  percentage: number;
}

export class DailyStatsDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ description: 'Revenue for the day' })
  revenue: number;

  @ApiProperty({ description: 'Expenses for the day' })
  expenses: number;

  @ApiProperty({ description: 'Net cash flow for the day' })
  netFlow: number;

  @ApiProperty({ description: 'Number of transactions for the day' })
  transactionCount: number;
}

export class MonthlyStatsDto {
  @ApiProperty({ description: 'Month in YYYY-MM format' })
  month: string;

  @ApiProperty({ description: 'Revenue for the month' })
  revenue: number;

  @ApiProperty({ description: 'Expenses for the month' })
  expenses: number;

  @ApiProperty({ description: 'Net cash flow for the month' })
  netFlow: number;

  @ApiProperty({ description: 'Number of transactions for the month' })
  transactionCount: number;
}

export class YearlyStatsDto {
  @ApiProperty({ description: 'Year' })
  year: string;

  @ApiProperty({ description: 'Revenue for the year' })
  revenue: number;

  @ApiProperty({ description: 'Expenses for the year' })
  expenses: number;

  @ApiProperty({ description: 'Net cash flow for the year' })
  netFlow: number;

  @ApiProperty({ description: 'Number of transactions for the year' })
  transactionCount: number;
}

export class CashReportResponseDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total expenses' })
  totalExpenses: number;

  @ApiProperty({ description: 'Net cash flow' })
  netCashFlow: number;

  @ApiProperty({ description: 'Total number of transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Pending amount' })
  pendingAmount: number;

  @ApiProperty({ description: 'Completed amount' })
  completedAmount: number;

  @ApiProperty({ description: 'Cancelled amount' })
  cancelledAmount: number;

  @ApiProperty({
    description: 'Department statistics',
    type: [DepartmentStatsDto],
  })
  departmentStats: DepartmentStatsDto[];

  @ApiProperty({
    description: 'Payment method statistics',
    type: [PaymentMethodStatsDto],
  })
  paymentMethodStats: PaymentMethodStatsDto[];

  @ApiProperty({ description: 'Daily statistics', type: [DailyStatsDto] })
  dailyStats: DailyStatsDto[];

  @ApiProperty({ description: 'Monthly statistics', type: [MonthlyStatsDto] })
  monthlyStats: MonthlyStatsDto[];

  @ApiProperty({ description: 'Yearly statistics', type: [YearlyStatsDto] })
  yearlyStats: YearlyStatsDto[];
}

