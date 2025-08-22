import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Business,
  Description,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContractStats();
      if (response.success) {
        setStats(response.data.stats);
      } else {
        setError('Erro ao carregar estatísticas');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor',error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Bem-vindo, {user?.full_name}! Aqui está um resumo das suas atividades.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Contratos"
            value={stats?.total_contracts || 0}
            icon={<Description fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Contratos Ativos"
            value={stats?.active_contracts || 0}
            icon={<TrendingUp fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Valor Total"
            value={`R$ ${(stats?.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<Business fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Valor Pago"
            value={`R$ ${(stats?.paid_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<People fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status dos Contratos
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Rascunhos: {stats?.draft_contracts || 0}
                </Typography>
                <Typography variant="body2">
                  Ativos: {stats?.active_contracts || 0}
                </Typography>
                <Typography variant="body2">
                  Concluídos: {stats?.completed_contracts || 0}
                </Typography>
                <Typography variant="body2">
                  Cancelados: {stats?.cancelled_contracts || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status de Pagamento
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Valor Pago: R$ {(stats?.paid_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2">
                  Valor Pendente: R$ {(stats?.pending_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2">
                  Valor Final Total: R$ {(stats?.final_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;

