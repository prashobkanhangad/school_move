import { Box, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      justifyContent="space-between"
      gap={2}
      mb={3}
    >
      <Box minWidth={0} flex={1}>
        <Typography
          variant="h5"
          fontWeight={600}
          mb={description ? 0.5 : 0}
          sx={{ letterSpacing: '-0.02em', lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ flexShrink: 0, alignItems: 'center' }}
        >
          {actions}
        </Stack>
      )}
    </Box>
  );
}
