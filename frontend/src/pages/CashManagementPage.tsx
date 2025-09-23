import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  Skeleton,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  RequestPage,
  CheckCircle,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from '../components/common/PageHeader';

interface CashTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  reference: string;
}

interface CashRequest {
  id: string;
  requester: string;
  amount: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  department: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`cash-tabpanel-${index}`}
      aria-labelledby={`cash-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const CashManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [requests, setRequests] = useState<CashRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasPermission } = usePermissions();

  // Mock data for demonstration
  useEffect(() => {
    const mockTransactions: CashTransaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 1500.0,
        description: 'Patient consultation fee',
        category: 'Consultation',
        date: '2024-01-15',
        status: 'completed',
        reference: 'TXN001',
      },
      {
        id: '2',
        type: 'expense',
        amount: 250.0,
        description: 'Medical supplies purchase',
        category: 'Supplies',
        date: '2024-01-14',
        status: 'completed',
        reference: 'TXN002',
      },
      {
        id: '3',
        type: 'income',
        amount: 800.0,
        description: 'Laboratory test fee',
        category: 'Laboratory',
        date: '2024-01-13',
        status: 'completed',
        reference: 'TXN003',
      },
    ];

    const mockRequests: CashRequest[] = [
      {
        id: '1',
        requester: 'Dr. John Doe',
        amount: 500.0,
        purpose: 'Emergency medical supplies',
        status: 'pending',
        requestDate: '2024-01-15',
        department: 'Emergency',
      },
      {
        id: '2',
        requester: 'Nurse Jane Smith',
        amount: 300.0,
        purpose: 'Department equipment maintenance',
        status: 'approved',
        requestDate: '2024-01-14',
        department: 'Cardiology',
      },
      {
        id: '3',
        requester: 'Dr. Mike Johnson',
        amount: 750.0,
        purpose: 'Specialized medical instruments',
        status: 'rejected',
        requestDate: '2024-01-13',
        department: 'Surgery',
      },
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);
      setRequests(mockRequests);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddTransaction = () => {
    navigate('/cash/transactions');
  };

  const handleAddRequest = () => {
    navigate('/cash/requests');
  };

  const handleEditTransaction = (id: string) => {
    navigate(`/cash/transactions?edit=${id}`);
  };

  const handleViewTransaction = (id: string) => {
    navigate(`/cash/transactions?view=${id}`);
  };

  const handleEditRequest = (id: string) => {
    navigate(`/cash/requests?edit=${id}`);
  };

  const handleViewRequest = (id: string) => {
    navigate(`/cash/requests?view=${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle fontSize='small' />;
      case 'pending':
        return <Pending fontSize='small' />;
      case 'cancelled':
      case 'rejected':
        return <Cancel fontSize='small' />;
      default:
        return null;
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title='Cash Management'
          subtitle='Manage cash transactions, requests, and financial overview'
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent>
                <Skeleton variant='text' width='60%' height={24} />
                <Skeleton variant='text' width='40%' height={20} />
                <Skeleton variant='rectangular' height={60} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title='Cash Management'
        subtitle='Manage cash transactions, requests, and financial overview'
      />

      {/* Key Metrics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUp sx={{ color: 'success.main', fontSize: 40 }} />
              <Box>
                <Typography variant='h4' component='div' color='success.main'>
                  ${totalIncome.toFixed(2)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Income
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingDown sx={{ color: 'error.main', fontSize: 40 }} />
              <Box>
                <Typography variant='h4' component='div' color='error.main'>
                  ${totalExpenses.toFixed(2)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Expenses
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccountBalance sx={{ color: 'primary.main', fontSize: 40 }} />
              <Box>
                <Typography
                  variant='h4'
                  component='div'
                  color={netCashFlow >= 0 ? 'success.main' : 'error.main'}
                >
                  ${netCashFlow.toFixed(2)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Net Cash Flow
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <RequestPage sx={{ color: 'warning.main', fontSize: 40 }} />
              <Box>
                <Typography variant='h4' component='div' color='warning.main'>
                  {pendingRequests.length}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Pending Requests
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='cash management tabs'
            >
              <Tab label='Overview' />
              <Tab label='Transactions' />
              <Tab label='Cash Requests' />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                },
                gap: 3,
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Recent Transactions
                  </Typography>
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.slice(0, 5).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <Chip
                                label={transaction.type}
                                color={
                                  transaction.type === 'income'
                                    ? 'success'
                                    : 'error'
                                }
                                size='small'
                              />
                            </TableCell>
                            <TableCell>
                              ${transaction.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(transaction.status)}
                                label={transaction.status}
                                color={
                                  getStatusColor(transaction.status) as any
                                }
                                size='small'
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Request Summary
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2'>Pending</Typography>
                      <Chip
                        label={pendingRequests.length}
                        color='warning'
                        size='small'
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2'>Approved</Typography>
                      <Chip
                        label={approvedRequests.length}
                        color='success'
                        size='small'
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2'>Rejected</Typography>
                      <Chip
                        label={rejectedRequests.length}
                        color='error'
                        size='small'
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <TextField
                  placeholder='Search transactions...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: 400 }}
                />
                {hasPermission('create_transaction') && (
                  <Button
                    variant='contained'
                    startIcon={<Add />}
                    onClick={handleAddTransaction}
                  >
                    Add Transaction
                  </Button>
                )}
              </Box>

              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reference</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.reference}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type}
                            color={
                              transaction.type === 'income'
                                ? 'success'
                                : 'error'
                            }
                            size='small'
                          />
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(transaction.status)}
                            label={transaction.status}
                            color={getStatusColor(transaction.status) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {hasPermission('edit_transaction') && (
                              <Tooltip title='Edit Transaction'>
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    handleEditTransaction(transaction.id)
                                  }
                                >
                                  <Edit fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                            {hasPermission('view_transaction_details') && (
                              <Tooltip title='View Details'>
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    handleViewTransaction(transaction.id)
                                  }
                                >
                                  <Visibility fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant='h6'>Cash Requests</Typography>
                {hasPermission('create_cash_request') && (
                  <Button
                    variant='contained'
                    startIcon={<Add />}
                    onClick={handleAddRequest}
                  >
                    New Request
                  </Button>
                )}
              </Box>

              <TableContainer component={Paper} variant='outlined'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Requester</TableCell>
                      <TableCell>Purpose</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Request Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.requester}</TableCell>
                        <TableCell>{request.purpose}</TableCell>
                        <TableCell>{request.department}</TableCell>
                        <TableCell>${request.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(request.requestDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={request.status}
                            color={getStatusColor(request.status) as any}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {hasPermission('edit_cash_request') && (
                              <Tooltip title='Edit Request'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleEditRequest(request.id)}
                                >
                                  <Edit fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                            {hasPermission('view_cash_request_details') && (
                              <Tooltip title='View Details'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleViewRequest(request.id)}
                                >
                                  <Visibility fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};
