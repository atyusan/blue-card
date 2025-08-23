import { ApiProperty } from '@nestjs/swagger';

export class PatientStatsDto {
  @ApiProperty({ description: 'Total number of patients' })
  total: number;

  @ApiProperty({ description: 'New patients this month' })
  newThisMonth: number;

  @ApiProperty({ description: 'Active patients today' })
  activeToday: number;

  @ApiProperty({ description: 'Patient growth percentage' })
  growth: number;
}

export class AppointmentStatsDto {
  @ApiProperty({ description: 'Total appointments' })
  total: number;

  @ApiProperty({ description: 'Appointments today' })
  todayCount: number;

  @ApiProperty({ description: 'Appointments this week' })
  weekCount: number;

  @ApiProperty({ description: 'Appointments this month' })
  monthCount: number;

  @ApiProperty({ description: 'Upcoming appointments' })
  upcomingCount: number;
}

export class RevenueStatsDto {
  @ApiProperty({ description: 'Revenue this month' })
  thisMonth: number;

  @ApiProperty({ description: 'Revenue last month' })
  lastMonth: number;

  @ApiProperty({ description: 'Revenue growth percentage' })
  growth: number;

  @ApiProperty({ description: 'Year to date revenue' })
  yearToDate: number;
}

export class InvoiceStatsDto {
  @ApiProperty({ description: 'Total invoices' })
  total: number;

  @ApiProperty({ description: 'Pending invoices' })
  pending: number;

  @ApiProperty({ description: 'Overdue invoices' })
  overdue: number;

  @ApiProperty({ description: 'Invoices paid this month' })
  paidThisMonth: number;
}

export class DashboardStatsDto {
  @ApiProperty({ type: PatientStatsDto })
  patients: PatientStatsDto;

  @ApiProperty({ type: AppointmentStatsDto })
  appointments: AppointmentStatsDto;

  @ApiProperty({ type: RevenueStatsDto })
  revenue: RevenueStatsDto;

  @ApiProperty({ type: InvoiceStatsDto })
  invoices: InvoiceStatsDto;
}
