import { Box, Stack, Typography } from '@mui/material';
import { brand } from '../brand';

export function AppMockup({
  variant = 'parent',
  height = 520,
}: {
  variant?: 'parent' | 'driver';
  height?: number;
}) {
  return (
    <Box
      sx={{
        width: 270,
        maxWidth: '100%',
        height,
        bgcolor: '#0B1220',
        borderRadius: '36px',
        p: '10px',
        boxShadow: '0 24px 50px rgba(0, 30, 78, 0.22)',
      }}
    >
      <Box
        sx={{
          height: '100%',
          bgcolor: brand.white,
          borderRadius: '28px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ height: 22, bgcolor: brand.white, position: 'relative' }}>
          <Box
            sx={{
              width: 88,
              height: 14,
              bgcolor: '#0B1220',
              borderRadius: '0 0 12px 12px',
              mx: 'auto',
            }}
          />
        </Box>
        {variant === 'parent' ? <ParentScreen /> : <DriverScreen />}
      </Box>
    </Box>
  );
}

function ParentScreen() {
  const events = [
    { t: '7:12 AM', label: 'Bus started', done: true },
    { t: '7:28 AM', label: 'Bus approaching', done: true },
    { t: '7:31 AM', label: 'Aarav picked up', done: true },
    { t: '7:48 AM', label: 'Reached school', done: false },
    { t: '2:10 PM', label: 'Return trip started', done: false },
    { t: '2:41 PM', label: 'Aarav dropped', done: false },
  ];

  return (
    <Box sx={{ px: 1.75, pb: 2, flex: 1, overflow: 'hidden' }}>
      <Typography sx={{ fontSize: 11, color: brand.muted, fontWeight: 600 }}>
        Green Valley International
      </Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: brand.navy, mt: 0.25 }}>
        Aarav’s Bus
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} mt={1} mb={1.5}>
        <Box
          sx={{
            bgcolor: 'rgba(21,128,61,0.12)',
            color: brand.success,
            fontSize: 11,
            fontWeight: 700,
            px: 1,
            py: 0.3,
            borderRadius: '999px',
          }}
        >
          On Route
        </Box>
        <Typography sx={{ fontSize: 12, color: brand.muted }}>Bus 12 · Ramesh Kumar</Typography>
      </Stack>
      <Box
        sx={{
          bgcolor: brand.navy,
          color: brand.white,
          borderRadius: '12px',
          p: 1.5,
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>Arriving in</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          8 min
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 0.5, color: brand.orange, fontWeight: 700 }}>
          HSR Layout → School
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: brand.navy, mb: 1 }}>Trip timeline</Typography>
      <Stack spacing={0.85}>
        {events.map((event) => (
          <Stack key={event.label} direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: event.done ? brand.success : brand.line,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 12, color: event.done ? brand.navy : brand.muted, fontWeight: event.done ? 600 : 500, flex: 1 }}>
              {event.label}
            </Typography>
            <Typography sx={{ fontSize: 11, color: brand.muted }}>{event.t}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function DriverScreen() {
  const students = [
    { name: 'Aarav Sharma', stop: 'HSR Layout', status: 'Picked up' },
    { name: 'Diya Nair', stop: '27th Main', status: 'Next' },
    { name: 'Kabir Rao', stop: 'Agara Lake', status: 'Waiting' },
  ];

  return (
    <Box sx={{ px: 1.75, pb: 2, flex: 1 }}>
      <Typography sx={{ fontSize: 11, color: brand.muted, fontWeight: 600 }}>Morning trip</Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: brand.navy, mt: 0.25 }}>Bus 12</Typography>
      <Typography sx={{ fontSize: 12.5, color: brand.muted, mb: 1.5 }}>HSR Layout → School</Typography>
      <Box
        sx={{
          bgcolor: brand.orange,
          color: brand.navy,
          borderRadius: '10px',
          py: 1.1,
          textAlign: 'center',
          fontWeight: 800,
          fontSize: 13,
          mb: 1.5,
        }}
      >
        Trip in progress
      </Box>
      <Stack spacing={1}>
        {students.map((s) => (
          <Box
            key={s.name}
            sx={{
              border: `1px solid ${brand.line}`,
              borderRadius: '10px',
              p: 1.1,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: brand.navy }}>{s.name}</Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: s.status === 'Picked up' ? brand.success : brand.navy,
                }}
              >
                {s.status}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 11, color: brand.muted }}>{s.stop}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
