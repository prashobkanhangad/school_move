import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../brand';
import { ghostBtn, navyBtn, sectionAnchor } from './styles';
import { SectionHeader } from './SectionHeader';
import { FadeIn } from './FadeIn';
import { LiveMapPreview } from './LiveMapPreview';
import { AppMockup } from './AppMockup';

const products = [
  {
    id: 'admin',
    kicker: 'School Admin Portal',
    title: 'For school administrators and transport teams.',
    points: [
      'Live fleet monitoring',
      'Bus management',
      'Driver management',
      'Student management',
      'Routes & stops',
      'Trip monitoring',
      'Pickup/drop status',
      'Notifications',
      'Reports',
    ],
    cta: 'Explore Admin Platform',
    to: '/login',
    visual: 'admin' as const,
  },
  {
    id: 'parents',
    kicker: 'Parent App',
    title: 'Designed around safety and peace of mind.',
    points: [
      'Track child’s bus live',
      'ETA to pickup/drop stop',
      'Bus approaching alerts',
      'Pickup confirmation',
      'Drop confirmation',
      'Trip timeline',
      'Emergency alerts',
    ],
    cta: 'Explore Parent Experience',
    href: '#parents',
    visual: 'parent' as const,
  },
  {
    id: 'drivers',
    kicker: 'Driver App',
    title: 'Simple and focused for drivers.',
    points: [
      'Start / End trip',
      'Assigned routes',
      'Stops',
      'Student list',
      'Pickup/drop confirmation',
      'Live GPS while on trip',
      'Emergency support',
    ],
    cta: 'Explore Driver App',
    href: '#how-it-works',
    visual: 'driver' as const,
  },
];

export function ProductShowcase() {
  return (
    <Box id="product" component="section" sx={{ bgcolor: brand.white, py: { xs: 8, md: 11 }, ...sectionAnchor }}>
      <Container maxWidth="lg">
        <SectionHeader
          eyebrow="Product"
          title="One Platform. Three Simple Experiences."
          subtitle="Administrators run the fleet. Drivers run the route. Parents stay informed — without extra phone calls."
          align="center"
        />
        <Stack spacing={{ xs: 6, md: 8 }}>
          {products.map((product, index) => (
            <FadeIn key={product.id} delay={index * 40}>
                <Box
                id={product.id === 'drivers' ? 'drivers' : undefined}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: { xs: 3.5, md: 6 },
                  alignItems: 'center',
                }}
              >
                <Box sx={{ order: { xs: 1, md: index % 2 ? 2 : 1 } }}>
                  <Typography
                    sx={{
                      color: brand.orange,
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: 1.4,
                      textTransform: 'uppercase',
                      mb: 1,
                    }}
                  >
                    {product.kicker}
                  </Typography>
                  <Typography
                    component="h3"
                    sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 800, color: brand.navy, letterSpacing: '-0.03em', mb: 2, lineHeight: 1.2 }}
                  >
                    {product.title}
                  </Typography>
                  <Box
                    component="ul"
                    sx={{
                      m: 0,
                      pl: 2.2,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 0.75,
                      mb: 3,
                    }}
                  >
                    {product.points.map((point) => (
                      <Typography key={point} component="li" sx={{ color: brand.muted, fontSize: 14.5, lineHeight: 1.5 }}>
                        {point}
                      </Typography>
                    ))}
                  </Box>
                  {'to' in product && product.to ? (
                    <Button component={RouterLink} to={product.to} variant="contained" sx={navyBtn}>
                      {product.cta}
                    </Button>
                  ) : (
                    <Button href={product.href} variant="outlined" sx={ghostBtn}>
                      {product.cta}
                    </Button>
                  )}
                </Box>
                <Box sx={{ order: { xs: 2, md: index % 2 ? 1 : 2 }, display: 'flex', justifyContent: 'center' }}>
                  {product.visual === 'admin' ? (
                    <Box sx={{ width: '100%', maxWidth: 480 }}>
                      <Box
                        sx={{
                          bgcolor: brand.white,
                          border: `1px solid ${brand.line}`,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 16px 40px rgba(0,30,78,0.08)',
                        }}
                      >
                        <Box sx={{ bgcolor: brand.navy, px: 2, py: 1.2 }}>
                          <Typography sx={{ color: brand.white, fontSize: 13, fontWeight: 600 }}>
                            Admin · Live Tracking
                          </Typography>
                        </Box>
                        <Box p={1.5}>
                          <LiveMapPreview compact />
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <AppMockup variant={product.visual} height={480} />
                  )}
                </Box>
              </Box>
            </FadeIn>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
