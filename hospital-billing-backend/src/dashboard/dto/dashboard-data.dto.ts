import { ApiProperty } from '@nestjs/swagger';
import { DashboardStatsDto } from './dashboard-stats.dto';
import { RecentActivityDto } from './recent-activity.dto';
import { ChartDataDto } from './chart-data.dto';
import { TopServiceDto } from './top-services.dto';

export class UpcomingAppointmentDto {
  @ApiProperty({ description: 'Appointment ID' })
  id: string;

  @ApiProperty({ description: 'Patient name' })
  patientName: string;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'Appointment date' })
  appointmentDate: string;

  @ApiProperty({ description: 'Appointment time' })
  appointmentTime: string;

  @ApiProperty({ description: 'Appointment status' })
  status: string;
}

export class OverdueInvoiceDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number' })
  number: string;

  @ApiProperty({ description: 'Patient name' })
  patientName: string;

  @ApiProperty({ description: 'Due date' })
  dueDate: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;
}

export class DashboardDataDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivities: RecentActivityDto[];

  @ApiProperty({ type: ChartDataDto })
  revenueChart: ChartDataDto;

  @ApiProperty({ type: ChartDataDto })
  appointmentChart: ChartDataDto;

  @ApiProperty({ type: [TopServiceDto] })
  topServices: TopServiceDto[];

  @ApiProperty({ type: [UpcomingAppointmentDto] })
  upcomingAppointments: UpcomingAppointmentDto[];

  @ApiProperty({ type: [OverdueInvoiceDto] })
  overdueInvoices: OverdueInvoiceDto[];
}
