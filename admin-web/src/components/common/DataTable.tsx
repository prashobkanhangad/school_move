import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  page?: number;
  rowsPerPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  emptyMessage?: string;
  emptyHint?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  page = 0,
  rowsPerPage = 20,
  total,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = 'No records found',
  emptyHint,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ width: '100%', overflow: 'hidden', borderRadius: 1.5 }}
      >
        <Box px={2} py={1.5} borderBottom="1px solid" borderColor="divider">
          <Skeleton width="40%" height={18} />
        </Box>
        <Box p={2}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={36} sx={{ mb: 1.25, borderRadius: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{ width: '100%', overflow: 'hidden', borderRadius: 1.5 }}
    >
      <TableContainer sx={{ maxHeight: 640 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={{
                    minWidth: col.minWidth,
                    fontWeight: 600,
                    bgcolor: '#F8FAFC',
                    color: 'text.secondary',
                    fontSize: 11,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.25,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 9 }}>
                  <Typography fontWeight={600} color="text.primary" variant="body2" mb={0.5}>
                    {emptyMessage}
                  </Typography>
                  {emptyHint && (
                    <Typography color="text.secondary" variant="caption" display="block">
                      {emptyHint}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  hover
                  key={row.id}
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    '& td': { borderColor: 'divider', py: 1.5, verticalAlign: 'middle' },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {total !== undefined && onPageChange && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => onPageChange(p)}
          onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '.MuiTablePagination-toolbar': { minHeight: 52 },
          }}
        />
      )}
    </Paper>
  );
}
