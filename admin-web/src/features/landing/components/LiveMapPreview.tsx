import { Box, Stack, Typography } from '@mui/material';
import { brand } from '../brand';

export function LiveMapPreview({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: compact ? '10px' : '12px',
        border: `1px solid ${brand.line}`,
        bgcolor: '#D9E3EE',
        height: compact ? 168 : { xs: 340, md: 460 },
        minHeight: compact ? 168 : undefined,
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 640 420"
        preserveAspectRatio="xMidYMid slice"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden
      >
        <rect width="640" height="420" fill="#D7E2ED" />
        <rect x="40" y="48" width="150" height="90" rx="8" fill="#C5D9C8" opacity="0.9" />
        <rect x="430" y="250" width="160" height="110" rx="8" fill="#C5D9C8" opacity="0.85" />
        <rect x="0" y="118" width="640" height="14" fill="#F4F7FA" />
        <rect x="0" y="248" width="640" height="14" fill="#F4F7FA" />
        <rect x="0" y="332" width="640" height="10" fill="#EEF3F8" />
        <rect x="118" y="0" width="14" height="420" fill="#F4F7FA" />
        <rect x="268" y="0" width="14" height="420" fill="#F4F7FA" />
        <rect x="428" y="0" width="12" height="420" fill="#EEF3F8" />
        <rect x="540" y="0" width="10" height="420" fill="#F4F7FA" />
        <path
          d="M72 360 C 140 350, 170 300, 210 250 S 290 170, 360 150 S 470 120, 548 88"
          fill="none"
          stroke={brand.navy}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M72 360 C 140 350, 170 300, 210 250 S 290 170, 360 150"
          fill="none"
          stroke={brand.orange}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="72" cy="360" r="8" fill={brand.white} stroke={brand.navy} strokeWidth="3" />
        <circle cx="210" cy="250" r="7" fill={brand.white} stroke={brand.navy} strokeWidth="2.5" />
        <circle cx="360" cy="150" r="7" fill={brand.white} stroke={brand.navy} strokeWidth="2.5" />
        <rect x="532" y="70" width="32" height="32" rx="6" fill={brand.navy} />
        <circle cx="268" cy="196" r="18" fill="rgba(252,162,0,0.28)" className="sm-pulse" />
        <circle cx="268" cy="196" r="11" fill={brand.orange} stroke={brand.white} strokeWidth="3" />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          left: compact ? 10 : 16,
          top: compact ? 10 : 16,
          bgcolor: brand.white,
          borderRadius: '10px',
          p: compact ? 1.1 : 1.75,
          minWidth: compact ? 168 : 220,
          boxShadow: '0 10px 28px rgba(0,30,78,0.12)',
          border: `1px solid ${brand.line}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography fontWeight={800} sx={{ color: brand.navy, fontSize: compact ? 13 : 15 }}>
            Bus 12
          </Typography>
          <Box
            sx={{
              bgcolor: 'rgba(21,128,61,0.12)',
              color: brand.success,
              fontSize: 11,
              fontWeight: 700,
              px: 1,
              py: 0.25,
              borderRadius: '999px',
            }}
          >
            On Route
          </Box>
        </Stack>
        <Typography sx={{ color: brand.muted, fontSize: compact ? 11 : 12, mb: 0.75 }}>
          KA 01 AB 4582
        </Typography>
        {!compact && (
          <>
            <Typography sx={{ color: brand.navy, fontSize: 13, fontWeight: 600 }}>
              Driver: Ramesh Kumar
            </Typography>
            <Typography sx={{ color: brand.muted, fontSize: 12.5, mt: 0.25 }}>
              Route: HSR Layout → School
            </Typography>
            <Typography sx={{ color: brand.navy, fontSize: 13, fontWeight: 700, mt: 0.75 }}>
              ETA 8 min
              <Box component="span" sx={{ color: brand.muted, fontWeight: 500, ml: 1 }}>
                · Updated 8 sec ago
              </Box>
            </Typography>
          </>
        )}
        {compact && (
          <Typography sx={{ color: brand.navy, fontSize: 12, fontWeight: 700 }}>ETA 8 min</Typography>
        )}
      </Box>

      {!compact && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'absolute', right: 16, bottom: 16 }}
        >
          <MapChip label="School" />
          <MapChip label="Stop" />
          <MapChip label="Bus 12" accent />
        </Stack>
      )}
    </Box>
  );
}

function MapChip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <Box
      sx={{
        bgcolor: brand.white,
        color: accent ? brand.navy : brand.muted,
        fontSize: 11,
        fontWeight: 700,
        px: 1.1,
        py: 0.55,
        borderRadius: '999px',
        border: `1px solid ${brand.line}`,
      }}
    >
      {label}
    </Box>
  );
}
