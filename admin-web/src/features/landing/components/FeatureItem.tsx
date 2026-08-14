import { Box, Typography } from '@mui/material';
import { brand } from '../brand';

export function FeatureItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2.25, md: 2.75 },
        height: '100%',
        bgcolor: brand.white,
        border: `1px solid ${brand.line}`,
        borderRadius: '12px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(0, 30, 78, 0.18)',
          boxShadow: '0 8px 24px rgba(0, 30, 78, 0.06)',
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: brand.paper,
          color: brand.navy,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.75,
          '& svg': { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      <Typography fontWeight={700} sx={{ color: brand.navy, mb: 0.75, fontSize: 16 }}>
        {title}
      </Typography>
      <Typography sx={{ color: brand.muted, fontSize: 14.5, lineHeight: 1.6 }}>{body}</Typography>
    </Box>
  );
}
