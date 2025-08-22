import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Página Não Encontrada
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        A página que você está procurando não existe ou foi movida.
      </Typography>
      <Button variant="contained" component={Link} to="/login">
        Voltar para o Login
      </Button>
    </Box>
  );
}

export default NotFoundPage;


