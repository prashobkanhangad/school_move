import { Chip } from '@mui/material';

type ChipColor = 'success' | 'warning' | 'error' | 'default' | 'info' | 'primary';

const colors: Record<string, ChipColor> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  SUSPENDED: 'error',
  MAINTENANCE: 'warning',
  COMPLETED: 'success',
  SCHEDULED: 'info',
  CANCELLED: 'default',
  SENT: 'success',
  READ: 'default',
  PENDING: 'warning',
  ACKNOWLEDGED: 'info',
  RESOLVED: 'success',
  ON_ROUTE: 'primary',
  DELAYED: 'warning',
  EMERGENCY: 'error',
  AVAILABLE: 'success',
  ON_TRIP: 'primary',
  OFFLINE: 'default',
};

function formatLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusChip({ status }: { status: string }) {
  const key = status?.toUpperCase?.() ?? status;
  const color = colors[key] || 'default';

  return (
    <Chip
      label={formatLabel(status)}
      size="small"
      color={color}
      variant="outlined"
      sx={{
        borderRadius: '999px',
        fontWeight: 600,
        letterSpacing: 0.1,
        bgcolor:
          color === 'default'
            ? 'grey.50'
            : color === 'success'
              ? 'rgba(21, 128, 61, 0.06)'
              : color === 'error'
                ? 'rgba(220, 38, 38, 0.06)'
                : color === 'warning'
                  ? 'rgba(217, 119, 6, 0.08)'
                  : color === 'info'
                    ? 'rgba(2, 132, 199, 0.06)'
                    : 'rgba(15, 118, 110, 0.06)',
      }}
    />
  );
}
