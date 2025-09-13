const express = require('express');
const axios = require('axios');
const router = express.Router();

// RBC API configuration - using the actual hackathon API
const RBC_BASE_URL = process.env.RBC_BASE_URL || 'https://2dcq63co40.execute-api.us-east-1.amazonaws.com/dev';

// Helper function to make RBC API calls
const makeRBCApiCall = async (endpoint, method = 'GET', data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${RBC_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    console.log(`Making RBC API call: ${method} ${endpoint}`);
    const response = await axios(config);
    console.log(`RBC API response: ${response.status} ${response.statusText}`);
    
    return response.data;
  } catch (error) {
    console.error('RBC API Error:', error.response?.data || error.message);
    throw error;
  }
};

// POST /rbc/teams/register - Register team and get JWT token
router.post('/teams/register', async (req, res) => {
  try {
    const { team_name, contact_email } = req.body;

    if (!team_name || !contact_email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'team_name and contact_email are required',
        timestamp: new Date().toISOString()
      });
    }

    const teamData = {
      team_name,
      contact_email
    };

    const rbcResponse = await makeRBCApiCall('/teams/register', 'POST', teamData);

    res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      teamId: rbcResponse.teamId,
      jwtToken: rbcResponse.jwtToken,
      expiresAt: rbcResponse.expiresAt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error registering team:', error);
    
    res.status(500).json({
      error: 'Failed to register team',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc/clients - Create a new client
router.post('/clients', async (req, res) => {
  try {
    const { name, email, cash, token } = req.body;

    if (!name || !email || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, email, and token are required',
        timestamp: new Date().toISOString()
      });
    }

    const clientData = {
      name,
      email,
      cash: cash || 10000
    };

    const rbcResponse = await makeRBCApiCall('/clients', 'POST', clientData, token);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: rbcResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating client:', error);
    
    res.status(500).json({
      error: 'Failed to create client',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /rbc/clients - Get all clients for team
router.get('/clients', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    const rbcResponse = await makeRBCApiCall('/clients', 'GET', null, token);

    res.json({
      success: true,
      clients: rbcResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    
    res.status(500).json({
      error: 'Failed to fetch clients',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /rbc/clients/:id - Get specific client
router.get('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    const rbcResponse = await makeRBCApiCall(`/clients/${id}`, 'GET', null, token);

    res.json({
      success: true,
      client: rbcResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Client not found',
        message: 'The requested client does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to fetch client',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc/clients/:id/portfolios - Create portfolio for client
router.post('/clients/:id/portfolios', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, initialAmount, token } = req.body;

    if (!type || !initialAmount || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'type, initialAmount, and token are required',
        timestamp: new Date().toISOString()
      });
    }

    const portfolioData = {
      type,
      initialAmount: parseFloat(initialAmount)
    };

    const rbcResponse = await makeRBCApiCall(`/clients/${id}/portfolios`, 'POST', portfolioData, token);

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      portfolio: rbcResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating portfolio:', error);
    
    res.status(500).json({
      error: 'Failed to create portfolio',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /rbc/clients/:id/portfolios - Get portfolios for client
router.get('/clients/:id/portfolios', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    const rbcResponse = await makeRBCApiCall(`/clients/${id}/portfolios`, 'GET', null, token);

    res.json({
      success: true,
      portfolios: rbcResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching portfolios:', error);
    
    res.status(500).json({
      error: 'Failed to fetch portfolios',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /rbc/portfolios/:id - Get specific portfolio
router.get('/portfolios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    const rbcResponse = await makeRBCApiCall(`/portfolios/${id}`, 'GET', null, token);

    res.json({
      success: true,
      portfolio: rbcResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching portfolio:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Portfolio not found',
        message: 'The requested portfolio does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to fetch portfolio',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc/portfolios/:id/transfer - Transfer funds to portfolio
router.post('/portfolios/:id/transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, token } = req.body;

    if (!amount || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'amount and token are required',
        timestamp: new Date().toISOString()
      });
    }

    const transferData = {
      amount: parseFloat(amount)
    };

    const rbcResponse = await makeRBCApiCall(`/portfolios/${id}/transfer`, 'POST', transferData, token);

    res.json({
      success: true,
      message: 'Funds transferred successfully',
      portfolio: rbcResponse.portfolio,
      client_cash: rbcResponse.client_cash,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error transferring funds:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Portfolio not found',
        message: 'The requested portfolio does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to transfer funds',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc/portfolios/:id/withdraw - Withdraw from portfolio
router.post('/portfolios/:id/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, token } = req.body;

    if (!amount || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'amount and token are required',
        timestamp: new Date().toISOString()
      });
    }

    const withdrawData = {
      amount: parseFloat(amount)
    };

    const rbcResponse = await makeRBCApiCall(`/portfolios/${id}/withdraw`, 'POST', withdrawData, token);

    res.json({
      success: true,
      message: 'Funds withdrawn successfully',
      portfolio: rbcResponse.portfolio,
      client_cash: rbcResponse.client_cash,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error withdrawing funds:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Portfolio not found',
        message: 'The requested portfolio does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to withdraw funds',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc/clients/:id/deposit - Deposit to client cash
router.post('/clients/:id/deposit', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, token } = req.body;

    if (!amount || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'amount and token are required',
        timestamp: new Date().toISOString()
      });
    }

    const depositData = {
      amount: parseFloat(amount)
    };

    const rbcResponse = await makeRBCApiCall(`/clients/${id}/deposit`, 'POST', depositData, token);

    res.json({
      success: true,
      message: 'Funds deposited successfully',
      client: rbcResponse.client,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error depositing funds:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Client not found',
        message: 'The requested client does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to deposit funds',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /rbc/client/:id/simulate - Simulate portfolios for client
router.post('/client/:id/simulate', async (req, res) => {
  try {
    const { id } = req.params;
    const { months, token } = req.body;

    if (!months || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'months and token are required',
        timestamp: new Date().toISOString()
      });
    }

    const simulationData = {
      months: parseInt(months)
    };

    const rbcResponse = await makeRBCApiCall(`/client/${id}/simulate`, 'POST', simulationData, token);

    res.json({
      success: true,
      message: 'Simulation completed successfully',
      results: rbcResponse.results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error simulating portfolios:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Client not found',
        message: 'The requested client does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to simulate portfolios',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /rbc/portfolios/:id/analysis - Get portfolio analysis
router.get('/portfolios/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString()
      });
    }

    const rbcResponse = await makeRBCApiCall(`/portfolios/${id}/analysis`, 'GET', null, token);

    res.json({
      success: true,
      analysis: rbcResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching portfolio analysis:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Portfolio not found',
        message: 'The requested portfolio does not exist',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to fetch portfolio analysis',
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;