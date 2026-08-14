import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import RouteIcon from '@mui/icons-material/Route';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MapIcon from '@mui/icons-material/Map';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getDashboardStats } from '@/services/auth.service';
import { PageHeader } from '@/components/common/PageHeader';

function StatCard({
  title,
  value,
  icon,
  color,
  loading,
  emphasis,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  emphasis?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        ...(emphasis && value > 0
          ? {
              borderColor: color,
              bgcolor: `${color}08`,
            }
          : {}),
        ...(onClick
          ? {
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }
          : {}),
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box minWidth={0}>
            <Typography color="text.secondary" variant="caption" fontWeight={600} display="block" mb={0.75}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={48} height={28} />
            ) : (
              <Typography variant="h5" fontWeight={700} letterSpacing={-0.5} lineHeight={1.1}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}14`,
              color,
              width: 36,
              height: 36,
              borderRadius: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& .MuiSvgIcon-root': { fontSize: 18 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const opsCards = [
    {
      title: 'Active Buses',
      value: stats?.activeBuses ?? 0,
      icon: <DirectionsBusIcon />,
      color: '#15803D',
      onClick: () => navigate('/buses'),
    },
    {
      title: 'Trips in Progress',
      value: stats?.activeTrips ?? 0,
      icon: <GpsFixedIcon />,
      color: '#0F766E',
      onClick: () => navigate('/monitoring'),
    },
    {
      title: 'Open Emergencies',
      value: stats?.activeEmergencies ?? 0,
      icon: <WarningAmberIcon />,
      color: '#DC2626',
      emphasis: true,
      onClick: () => navigate('/emergencies'),
    },
  ];

  const fleetCards = [
    { title: 'Total Buses', value: stats?.totalBuses ?? 0, icon: <DirectionsBusIcon />, color: '#0369A1' },
    { title: 'Drivers', value: stats?.totalDrivers ?? 0, icon: <PersonIcon />, color: '#0369A1' },
    { title: 'Students', value: stats?.totalStudents ?? 0, icon: <PeopleIcon />, color: '#0369A1' },
    { title: 'Routes', value: stats?.totalRoutes ?? 0, icon: <RouteIcon />, color: '#0369A1' },
  ];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        description="Today’s school transport operations at a glance."
        actions={
          <Button
            variant="contained"
            startIcon={<MapIcon />}
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/monitoring')}
          >
            Live Tracking
          </Button>
        }
      />

      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        letterSpacing={0.5}
        textTransform="uppercase"
        display="block"
        mb={1.25}
      >
        Now
      </Typography>
      <Grid container spacing={1.5} mb={3}>
        {opsCards.map((card) => (
          <Grid item xs={12} sm={4} key={card.title}>
            <StatCard {...card} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        letterSpacing={0.5}
        textTransform="uppercase"
        display="block"
        mb={1.25}
      >
        Fleet
      </Typography>
      <Grid container spacing={1.5} mb={3}>
        {fleetCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <StatCard {...card} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
            Quick actions
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Jump to the screens you’ll use most during the school day.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" onClick={() => navigate('/monitoring')}>
              Open live map
            </Button>
            <Button variant="outlined" onClick={() => navigate('/emergencies')}>
              Review emergencies
            </Button>
            <Button variant="outlined" onClick={() => navigate('/buses')}>
              Manage buses
            </Button>
            <Button variant="outlined" onClick={() => navigate('/drivers')}>
              Manage drivers
            </Button>
            <Button variant="outlined" onClick={() => navigate('/students')}>
              Manage students
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
