import { Box, Button, Stack, Typography } from '@mui/material';
import { brand } from '../brand';
import { ghostBtn, primaryBtn } from './styles';
import { SectionHeader } from './SectionHeader';

const included = [
  'Live bus tracking for your fleet',
  'School admin portal',
  'Parent and driver apps',
  'Pickup and drop notifications',
  'Onboarding and deployment support',
];

export function PricingTable() {
  return (
    <Box>
      <SectionHeader
        eyebrow="Pricing"
        title="Pricing Built Around Your School"
        subtitle="SchoolMove is quoted for your fleet size, routes, and how you want to roll out. Talk to sales for a plan that fits your school."
        align="center"
      />
      <Box
        sx={{
          maxWidth: 640,
          mx: 'auto',
          p: { xs: 3, md: 4 },
          bgcolor: brand.white,
          borderRadius: '12px',
          border: `1px solid ${brand.line}`,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: brand.navy, fontWeight: 800, fontSize: { xs: 20, md: 22 }, mb: 1 }}>
          Every school is different.
        </Typography>
        <Typography sx={{ color: brand.muted, fontSize: 15.5, lineHeight: 1.65, mb: 2.5 }}>
          Pricing depends on the number of buses, campuses, and whether you need custom branding.
          We’ll share a clear quote after a short demo.
        </Typography>
        <Box component="ul" sx={{ m: 0, mb: 3, pl: 0, listStyle: 'none', textAlign: 'left', maxWidth: 420, mx: 'auto' }}>
          {included.map((item) => (
            <Typography
              key={item}
              component="li"
              sx={{
                color: brand.navy,
                fontSize: 14.5,
                mb: 0.85,
                pl: 2.25,
                position: 'relative',
                '&::before': {
                  content: '"•"',
                  position: 'absolute',
                  left: 0,
                  color: brand.orange,
                  fontWeight: 800,
                },
              }}
            >
              {item}
            </Typography>
          ))}
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="center">
          <Button href="#contact" variant="contained" sx={primaryBtn}>
            Talk to Sales
          </Button>
          <Button href="#contact" variant="outlined" sx={ghostBtn}>
            Book a Demo
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
