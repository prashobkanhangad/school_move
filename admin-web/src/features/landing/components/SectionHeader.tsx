import { Box, Typography } from '@mui/material';
import { brand } from '../brand';

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  light = false,
  titleComponent = 'h2',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
  titleComponent?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <Box
      mb={{ xs: 4, md: 5 }}
      maxWidth={align === 'center' ? 720 : 680}
      mx={align === 'center' ? 'auto' : 0}
      textAlign={align}
    >
      {eyebrow && (
        <Typography
          sx={{
            color: brand.orange,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            mb: 1.25,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        component={titleComponent}
        sx={{
          fontSize: { xs: 28, md: 40 },
          fontWeight: 800,
          letterSpacing: '-0.035em',
          color: light ? brand.white : brand.navy,
          mb: subtitle ? 1.5 : 0,
          lineHeight: 1.15,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            color: light ? 'rgba(255,255,255,0.78)' : brand.muted,
            fontSize: { xs: 16, md: 17 },
            lineHeight: 1.65,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
