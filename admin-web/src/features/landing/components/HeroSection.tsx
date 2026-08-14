import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { brand } from '../brand';
import { ghostBtn, primaryBtn, sectionAnchor } from './styles';
import { LiveMapPreview } from './LiveMapPreview';
import { AppMockup } from './AppMockup';

export function HeroSection() {
  return (
    <Box id="top" component="section" sx={{ bgcolor: brand.white, ...sectionAnchor, overflow: 'hidden' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.05fr)' },
            gap: { xs: 5, md: 6 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              sx={{
                color: brand.orange,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                mb: 1.75,
              }}
            >
              Smart School Transport
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 34, sm: 44, md: 52 },
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: brand.navy,
                lineHeight: 1.08,
                mb: 2.25,
              }}
            >
              Safer School Journeys.
              <Box component="span" sx={{ display: 'block' }}>
                Complete Transport Visibility.
              </Box>
            </Typography>
            <Typography sx={{ color: brand.muted, fontSize: { xs: 16, md: 17.5 }, lineHeight: 1.7, mb: 1.5, maxWidth: 540 }}>
              SchoolMove helps schools manage buses, routes, drivers and student trips while giving
              parents real-time visibility into their child’s school journey.
            </Typography>
            <Typography sx={{ color: brand.navy, fontSize: 15, fontWeight: 600, lineHeight: 1.65, mb: 3.5, maxWidth: 540 }}>
              Get live bus tracking using the driver's smartphone — without installing dedicated GPS
              hardware on every bus.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button href="#contact" variant="contained" size="large" sx={{ ...primaryBtn, minHeight: 48 }}>
                Book a Demo
              </Button>
              <Button href="#how-it-works" variant="outlined" size="large" sx={{ ...ghostBtn, minHeight: 48 }}>
                See How It Works
              </Button>
            </Stack>
            <Typography sx={{ mt: 2.5, fontSize: 13, color: brand.muted, fontWeight: 500 }}>
              Built for schools, parents and transport teams.
            </Typography>
          </Box>

          <HeroShowcase />
        </Box>
      </Container>
    </Box>
  );
}

function HeroShowcase() {
  return (
    <Box sx={{ position: 'relative', minHeight: { xs: 420, md: 540 } }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          left: 0,
          top: 28,
          width: '74%',
          zIndex: 1,
          bgcolor: brand.white,
          border: `1px solid ${brand.line}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 22px 50px rgba(0, 30, 78, 0.12)',
        }}
      >
        <Box sx={{ bgcolor: brand.navy, px: 2, py: 1.15, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: brand.orange }} />
          <Typography sx={{ color: brand.white, fontSize: 12, fontWeight: 600 }}>
            Green Valley International School · Live fleet
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, bgcolor: brand.paper }}>
          <Stack direction="row" spacing={1} mb={1.25}>
            <MiniStat label="Active buses" value="8" />
            <MiniStat label="On route" value="6" />
            <MiniStat label="ETA alerts" value="2" />
          </Stack>
          <LiveMapPreview compact />
        </Box>
      </Box>

      <Box
        sx={{
          position: { xs: 'relative', md: 'absolute' },
          right: { md: 0 },
          top: { md: 0 },
          zIndex: 3,
          display: 'flex',
          justifyContent: { xs: 'center', md: 'flex-end' },
        }}
      >
        <AppMockup variant="parent" height={500} />
      </Box>

      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          left: 24,
          bottom: 18,
          zIndex: 4,
          bgcolor: brand.white,
          border: `1px solid ${brand.line}`,
          borderRadius: '10px',
          px: 1.5,
          py: 1.1,
          boxShadow: '0 12px 28px rgba(0,30,78,0.12)',
          minWidth: 220,
        }}
      >
        <Typography sx={{ fontSize: 11, color: brand.success, fontWeight: 700 }}>Pickup confirmed</Typography>
        <Typography sx={{ fontSize: 13, color: brand.navy, fontWeight: 700 }}>Aarav Sharma boarded Bus 12</Typography>
        <Typography sx={{ fontSize: 11, color: brand.muted }}>7:31 AM · HSR Layout</Typography>
      </Box>
    </Box>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: '8px', px: 1.1, py: 0.85 }}>
      <Typography sx={{ fontSize: 11, color: brand.muted, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: 16, fontWeight: 800, color: brand.navy, lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  );
}
