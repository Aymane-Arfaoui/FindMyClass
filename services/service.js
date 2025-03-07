import Config from 'react-native-config';
const API_USER=Config.API_USER;
const CONCORDIA_API_KEY= Config.CONCORDIA_API_KEY;
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for concordia
app.use(cors());

app.get('/api/buildinglist', async (req, res) => {
    try {
        console.warn('Fetching building list from Concordia API...');
        const response = await axios.get('https://opendata.concordia.ca/API/v1/facilities/buildinglist/', {
            auth: {
                username: API_USER,
                password: CONCORDIA_API_KEY
            },
            headers: {
                'Accept': 'application/json'
            }
        });

        console.warn('API response received:', response.status);
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            console.error('API responded with error:', error.response.status, error.response.data);
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            console.error('Error:', error.message);
            res.status(500).json({ error: 'Failed to fetch building list' });
        }
    }
});

app.listen(PORT, () => {
    console.warn(`Server running on http://localhost:${PORT}`);
});
