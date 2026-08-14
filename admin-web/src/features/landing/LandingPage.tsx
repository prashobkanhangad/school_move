import { useEffect } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import HubIcon from '@mui/icons-material/Hub';
import DirectionsBusFilledIcon from '@mui/icons-material/DirectionsBusFilled';
import PersonIcon from '@mui/icons-material/Person';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RouteIcon from '@mui/icons-material/Route';
import FlagIcon from '@mui/icons-material/Flag';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BoltIcon from '@mui/icons-material/Bolt';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LayersIcon from '@mui/icons-material/Layers';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { brand } from './brand';
import { sectionAnchor } from './components/styles';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SectionHeader } from './components/SectionHeader';
import { FeatureItem } from './components/FeatureItem';
import { ProductShowcase } from './components/ProductShowcase';
import { LiveMapPreview } from './components/LiveMapPreview';
import { AppMockup } from './components/AppMockup';
import { PricingTable } from './components/PricingTable';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';
import { ContactForm } from './components/ContactForm';
import { FadeIn } from './components/FadeIn';

const TITLE = 'SchoolMove | Smart School Bus Management & Live Tracking';
const DESCRIPTION =
  'SchoolMove helps schools manage buses, routes, drivers and student trips while giving parents real-time school bus tracking, ETA and pickup/drop notifications.';

const trustItems = [
  { icon: <GpsFixedIcon />, title: 'Live Tracking', body: 'Real-time bus visibility' },
  { icon: <NotificationsActiveIcon />, title: 'Pickup & Drop Updates', body: 'Parents know when their child boards or exits' },
  { icon: <PhoneIphoneIcon />, title: 'No GPS Hardware Required', body: 'Driver smartphone can provide live location' },
  { icon: <HubIcon />, title: 'Centralized Management', body: 'Manage buses, drivers, students and routes' },
];

const problems = [
  'Parents calling to ask where the bus is',
  'Unclear pickup and drop timings',
  'No live visibility of buses',
  'Manual coordination with drivers',
  'Poor communication during delays',
  'Limited transport history and reporting',
];

const steps = [
  { n: '1', title: 'Driver Starts Trip', body: 'The driver starts the school trip using the SchoolMove Driver App.' },
  { n: '2', title: 'Location Updates Live', body: "The driver's smartphone securely sends live location updates." },
  { n: '3', title: 'School Monitors the Fleet', body: 'School administrators can monitor active buses and trips from one dashboard.' },
  { n: '4', title: 'Parents Stay Informed', body: 'Parents see live bus location, ETA, pickup/drop updates and alerts.' },
];

const ops = [
  { icon: <DirectionsBusFilledIcon />, title: 'Buses', body: 'Manage fleet information and assignments.' },
  { icon: <PersonIcon />, title: 'Drivers', body: 'Assign drivers and monitor trip status.' },
  { icon: <PeopleAltIcon />, title: 'Students', body: 'Map students to buses, routes and stops.' },
  { icon: <RouteIcon />, title: 'Routes & Stops', body: 'Manage pickup/drop routes centrally.' },
  { icon: <FlagIcon />, title: 'Trips', body: 'Monitor morning and evening journeys.' },
  { icon: <WarningAmberIcon />, title: 'Alerts', body: 'Identify delays, GPS issues and emergencies.' },
  { icon: <AssessmentIcon />, title: 'Reports', body: 'Review trip history and transport activity.' },
];

const audiences = [
  'Private Schools',
  'International Schools',
  'School Groups',
  'Schools managing their own bus fleet',
  'Schools with 5–50+ buses',
  'Schools looking to improve parent communication',
];

const why = [
  { icon: <BoltIcon />, title: 'Faster Deployment', body: 'Start without installing GPS hardware on every bus.' },
  { icon: <FavoriteBorderIcon />, title: 'Better Parent Experience', body: 'Parents receive clear, real-time transport updates.' },
  { icon: <LayersIcon />, title: 'One Transport Platform', body: 'Manage buses, routes, drivers and students together.' },
  { icon: <TrendingUpIcon />, title: 'Built to Scale', body: 'Suitable for small school fleets and larger operations.' },
  { icon: <VisibilityIcon />, title: 'Live Operational Visibility', body: 'See what is happening across your transport fleet.' },
  { icon: <ShieldOutlinedIcon />, title: 'Safety-First Communication', body: 'Important transport and emergency updates reach parents quickly.' },
];

export function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = TITLE;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const previous = meta.getAttribute('content');
    meta.setAttribute('content', DESCRIPTION);
    return () => {
      document.title = previousTitle;
      if (previous) meta.setAttribute('content', previous);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: brand.white,
        color: brand.ink,
        overflowX: 'hidden',
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      <Navbar />
      <HeroSection />

      <Box component="section" sx={{ bgcolor: brand.paper, py: { xs: 3.5, md: 4 }, borderTop: `1px solid ${brand.line}`, borderBottom: `1px solid ${brand.line}` }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: { xs: 2.5, md: 3 },
            }}
          >
            {trustItems.map((item) => (
              <Stack key={item.title} direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ color: brand.navy, mt: 0.25, '& svg': { fontSize: 22 } }}>{item.icon}</Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: brand.navy, fontSize: 14.5 }}>{item.title}</Typography>
                  <Typography sx={{ color: brand.muted, fontSize: 13, lineHeight: 1.45 }}>{item.body}</Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.white }}>
        <Container maxWidth="lg">
          <FadeIn>
            <SectionHeader
              title="School Transport Shouldn’t Be a Daily Guess."
              subtitle="Schools and parents often struggle with unclear journeys, last-minute calls, and too little information when a bus is delayed."
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.25,
                maxWidth: 760,
                mb: 3,
              }}
            >
              {problems.map((item) => (
                <Stack key={item} direction="row" spacing={1.25} alignItems="flex-start">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: brand.orange, mt: 1, flexShrink: 0 }} />
                  <Typography sx={{ color: brand.navy, fontSize: 15.5, lineHeight: 1.55 }}>{item}</Typography>
                </Stack>
              ))}
            </Box>
            <Typography sx={{ color: brand.navy, fontWeight: 700, fontSize: { xs: 16, md: 18 }, maxWidth: 640, lineHeight: 1.55 }}>
              SchoolMove brings the entire school transport journey into one connected platform.
            </Typography>
          </FadeIn>
        </Container>
      </Box>

      <Box id="how-it-works" component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.paper, ...sectionAnchor }}>
        <Container maxWidth="lg">
          <SectionHeader eyebrow="How it works" title="One Connected Journey" align="center" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
              gap: { xs: 2, md: 0 },
            }}
          >
            {steps.map((step, i) => (
              <Box key={step.n} sx={{ position: 'relative', px: { md: 1.5 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: brand.navy,
                      color: brand.white,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {step.n}
                  </Box>
                  {i < steps.length - 1 && (
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'block' },
                        flex: 1,
                        height: 2,
                        bgcolor: brand.line,
                      }}
                    />
                  )}
                </Stack>
                <Typography sx={{ fontWeight: 800, color: brand.navy, mb: 0.75, fontSize: 17 }}>{step.title}</Typography>
                <Typography sx={{ color: brand.muted, fontSize: 14.5, lineHeight: 1.6 }}>{step.body}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <ProductShowcase />

      <Box id="tracking" component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.navy, ...sectionAnchor }}>
        <Container maxWidth="lg">
          <SectionHeader
            light
            title="Know Where Every Active Bus Is."
            subtitle="SchoolMove gives transport teams and parents live visibility into school bus journeys from start to finish."
          />
          <FadeIn>
            <LiveMapPreview />
          </FadeIn>
        </Container>
      </Box>

      <Box id="parents" component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.white, ...sectionAnchor }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
              gap: { xs: 4, md: 8 },
              alignItems: 'center',
            }}
          >
            <Box>
              <SectionHeader
                title="Give Parents Peace of Mind."
                subtitle="Parents don’t need to continuously call the school or driver. SchoolMove keeps them informed automatically."
              />
              <Typography sx={{ color: brand.muted, fontSize: 15.5, lineHeight: 1.7, maxWidth: 520 }}>
                From “bus started” to “Aarav dropped”, the Parent App shows a clear trip timeline, live ETA, and
                pickup/drop confirmations for children like Aarav Sharma at Green Valley International School.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <AppMockup variant="parent" />
            </Box>
          </Box>
        </Container>
      </Box>

      <Box id="schools" component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.paper, ...sectionAnchor }}>
        <Container maxWidth="lg">
          <SectionHeader
            title="Simplify Daily Transport Operations."
            subtitle="One admin portal for the work transport teams already do every morning and evening."
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {ops.map((item) => (
              <FeatureItem key={item.title} icon={item.icon} title={item.title} body={item.body} />
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.white }}>
        <Container maxWidth="lg">
          <SectionHeader
            title="Live Tracking Without Dedicated GPS Hardware."
            subtitle="SchoolMove can use the driver’s smartphone GPS for live bus tracking, helping schools launch quickly without purchasing and installing separate tracking hardware on every vehicle."
          />
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ md: 'center' }}
            sx={{ mb: 4 }}
          >
            {['Driver Phone', 'SchoolMove Cloud', 'Admin Dashboard + Parent App'].map((label, i, arr) => (
              <Stack key={label} direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={1.5} sx={{ flex: i === 2 ? 1.2 : 1 }}>
                <Box
                  sx={{
                    width: '100%',
                    textAlign: 'center',
                    py: 2,
                    px: 2,
                    bgcolor: brand.paper,
                    border: `1px solid ${brand.line}`,
                    borderRadius: '10px',
                    fontWeight: 700,
                    color: brand.navy,
                    fontSize: 14.5,
                  }}
                >
                  {label}
                </Box>
                {i < arr.length - 1 && (
                  <Typography sx={{ color: brand.orange, fontWeight: 800, display: { xs: 'none', md: 'block' } }}>→</Typography>
                )}
              </Stack>
            ))}
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.25,
              mb: 2.5,
            }}
          >
            {[
              'Lower upfront cost',
              'Faster implementation',
              'No additional GPS hardware initially',
              'Easy expansion when new buses are added',
            ].map((item) => (
              <Stack key={item} direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: brand.teal, flexShrink: 0 }} />
                <Typography sx={{ color: brand.navy, fontWeight: 600, fontSize: 15 }}>{item}</Typography>
              </Stack>
            ))}
          </Box>
          <Typography sx={{ color: brand.muted, fontSize: 14 }}>
            Dedicated GPS device integration can also be supported when required.
          </Typography>
        </Container>
      </Box>

      <Box id="pricing" component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.paper, ...sectionAnchor }}>
        <Container maxWidth="lg">
          <PricingTable />
        </Container>
      </Box>

      <Box id="about" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: brand.white, ...sectionAnchor }}>
        <Container maxWidth="lg">
          <SectionHeader title="Built for Modern Schools" subtitle="SchoolMove fits schools that already run their own transport — and want parents to see it clearly." />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {audiences.map((item) => (
              <Box
                key={item}
                sx={{
                  px: 2,
                  py: 1.75,
                  border: `1px solid ${brand.line}`,
                  borderRadius: '10px',
                  color: brand.navy,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {item}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.paper }}>
        <Container maxWidth="lg">
          <SectionHeader title="Why Schools Choose SchoolMove" />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {why.map((item) => (
              <FeatureItem key={item.title} icon={item.icon} title={item.title} body={item.body} />
            ))}
          </Box>
        </Container>
      </Box>

      <Box id="contact" component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.white, ...sectionAnchor }}>
        <Container maxWidth="md">
          <SectionHeader
            align="center"
            title="Let’s Set Up a Demo"
            subtitle="Share your school and fleet size. We’ll show live tracking, parent updates, and the admin portal in a short walkthrough."
          />
          <ContactForm />
        </Container>
      </Box>

      <CTASection />
      <Footer />
    </Box>
  );
}
