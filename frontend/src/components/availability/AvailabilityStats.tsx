import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  Schedule,
  CheckCircle,
  Warning,
  Block,
  TrendingUp,
  AccessTime,
} from '@mui/icons-material';
import type { StaffMember } from '../../services/staff.service';

interface AvailabilityStatsProps {
  provider: StaffMember | null;
  availabilityData: any;
  slotsData: any[];
}

const AvailabilityStats: React.FC<AvailabilityStatsProps> = ({
  provider,
  availabilityData,
  slotsData,
}) => {
  // Calculate statistics
  const stats = useMemo(() => {
    if (!slotsData || slotsData.length === 0) {
      return {
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
        blockedSlots: 0,
        fullSlots: 0,
        utilizationRate: 0,
        averageBookingRate: 0,
        weeklyStats: [],
        monthlyStats: [],
        slotTypeDistribution: {},
        timeSlotDistribution: {},
      };
    }

    const totalSlots = slotsData.length;
    const availableSlots = slotsData.filter(
      (slot) => slot.isAvailable && slot.currentBookings < slot.maxBookings
    ).length;
    const bookedSlots = slotsData.filter(
      (slot) => slot.currentBookings > 0
    ).length;
    const blockedSlots = slotsData.filter((slot) => !slot.isAvailable).length;
    const fullSlots = slotsData.filter(
      (slot) => slot.currentBookings >= slot.maxBookings
    ).length;

    const utilizationRate =
      totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
    const averageBookingRate =
      totalSlots > 0
        ? Math.round(
            (slotsData.reduce(
              (sum, slot) => sum + slot.currentBookings / slot.maxBookings,
              0
            ) /
              totalSlots) *
              100
          )
        : 0;

    // Weekly stats
    const weeklyStats = Array.from({ length: 7 }, (_, index) => {
      const daySlots = slotsData.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return slotDate.getDay() === index;
      });

      return {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
        total: daySlots.length,
        booked: daySlots.filter((slot) => slot.currentBookings > 0).length,
        utilization:
          daySlots.length > 0
            ? Math.round(
                (daySlots.filter((slot) => slot.currentBookings > 0).length /
                  daySlots.length) *
                  100
              )
            : 0,
      };
    });

    // Monthly stats (last 12 months)
    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - index);
      const monthStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      );

      const monthSlots = slotsData.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return slotDate >= monthStart && slotDate <= monthEnd;
      });

      return {
        month: targetDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        total: monthSlots.length,
        booked: monthSlots.filter((slot) => slot.currentBookings > 0).length,
        utilization:
          monthSlots.length > 0
            ? Math.round(
                (monthSlots.filter((slot) => slot.currentBookings > 0).length /
                  monthSlots.length) *
                  100
              )
            : 0,
      };
    }).reverse();

    // Slot type distribution
    const slotTypeDistribution = slotsData.reduce((acc, slot) => {
      acc[slot.slotType] = (acc[slot.slotType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time slot distribution (hourly)
    const timeSlotDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourSlots = slotsData.filter((slot) => {
        const slotHour = new Date(slot.startTime).getHours();
        return slotHour === hour;
      });

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count: hourSlots.length,
        booked: hourSlots.filter((slot) => slot.currentBookings > 0).length,
        utilization:
          hourSlots.length > 0
            ? Math.round(
                (hourSlots.filter((slot) => slot.currentBookings > 0).length /
                  hourSlots.length) *
                  100
              )
            : 0,
      };
    });

    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      blockedSlots,
      fullSlots,
      utilizationRate,
      averageBookingRate,
      weeklyStats,
      monthlyStats,
      slotTypeDistribution,
      timeSlotDistribution,
    };
  }, [slotsData]);

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CalendarToday fontSize='small' />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {stats.totalSlots}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Slots
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CheckCircle fontSize='small' />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {stats.utilizationRate}%
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Utilization Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'info.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Schedule fontSize='small' />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {stats.bookedSlots}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Booked Slots
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <TrendingUp fontSize='small' />
                </Box>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {stats.averageBookingRate}%
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Avg Booking Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Statistics */}
      <Grid container spacing={3}>
        {/* Slot Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title='Slot Status Distribution'
              subheader='Overview of your slot availability'
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color='success' fontSize='small' />
                    <Typography variant='body2'>Available</Typography>
                  </Box>
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>
                    {stats.availableSlots} (
                    {Math.round(
                      (stats.availableSlots / stats.totalSlots) * 100
                    )}
                    %)
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={(stats.availableSlots / stats.totalSlots) * 100}
                  color='success'
                  sx={{ height: 8, borderRadius: 4 }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule color='info' fontSize='small' />
                    <Typography variant='body2'>Booked</Typography>
                  </Box>
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>
                    {stats.bookedSlots} (
                    {Math.round((stats.bookedSlots / stats.totalSlots) * 100)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={(stats.bookedSlots / stats.totalSlots) * 100}
                  color='info'
                  sx={{ height: 8, borderRadius: 4 }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color='warning' fontSize='small' />
                    <Typography variant='body2'>Full</Typography>
                  </Box>
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>
                    {stats.fullSlots} (
                    {Math.round((stats.fullSlots / stats.totalSlots) * 100)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={(stats.fullSlots / stats.totalSlots) * 100}
                  color='warning'
                  sx={{ height: 8, borderRadius: 4 }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Block color='error' fontSize='small' />
                    <Typography variant='body2'>Blocked</Typography>
                  </Box>
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>
                    {stats.blockedSlots} (
                    {Math.round((stats.blockedSlots / stats.totalSlots) * 100)}
                    %)
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={(stats.blockedSlots / stats.totalSlots) * 100}
                  color='error'
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title='Weekly Performance'
              subheader='Utilization by day of the week'
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.weeklyStats.map((day, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant='body2' sx={{ fontWeight: 500 }}>
                        {day.day}
                      </Typography>
                      <Typography variant='body2'>
                        {day.booked}/{day.total} ({day.utilization}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant='determinate'
                      value={day.utilization}
                      color={getUtilizationColor(day.utilization)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Slot Type Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title='Slot Type Distribution'
              subheader='Types of appointments scheduled'
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(stats.slotTypeDistribution).map(
                  ([type, count]) => (
                    <Box key={type}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Chip
                          label={type.replace('_', ' ')}
                          size='small'
                          variant='outlined'
                        />
                        <Typography variant='body2'>
                          {count} (
                          {Math.round((count / stats.totalSlots) * 100)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={(count / stats.totalSlots) * 100}
                        color='primary'
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Peak Hours */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title='Peak Hours Analysis'
              subheader='Most popular time slots'
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.timeSlotDistribution
                  .filter((hour) => hour.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((hour, index) => (
                    <Box key={index}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          {hour.hour}
                        </Typography>
                        <Typography variant='body2'>
                          {hour.count} slots ({hour.utilization}% booked)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={hour.utilization}
                        color={getUtilizationColor(hour.utilization)}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AvailabilityStats;
