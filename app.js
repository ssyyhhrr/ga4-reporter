/**
 * Format number with commas as thousands separators
 * @param {number} num - The number to format
 * @returns {string} - Formatted number with commas
 */
function formatNumberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}/**
 * Fetch property name from GA4 Admin API
 * @param {string} propertyId - The GA4 property ID
 * @returns {Promise<string>} - The property name
 */
async function fetchPropertyName(propertyId) {
    try {
        // Make sure the auth client is authenticated
        await googleAuthClient.authorize();

        // Create analytics admin API client
        const analyticsAdmin = google.analyticsadmin({
            version: 'v1alpha',
            auth: googleAuthClient
        });

        // Get property details
        const response = await analyticsAdmin.properties.get({
            name: `properties/${propertyId}`
        });

        // Return the display name or a fallback
        return response.data.displayName || `Property ${propertyId}`;
    } catch (error) {
        console.error(`Error fetching property name for ${propertyId}:`, error.message);
        return `Property ${propertyId}`;
    }
}// app.js - Google Analytics 4 Pageviews API
// This application creates an API that returns pageviews data from Google Analytics 4
// Usage: node app.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { google } = require('googleapis');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Configuration
const SA_KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account-key.json';

// Create Analytics Data API client and Google API client
let analyticsDataClient;
let googleAuthClient;
try {
    const keyData = JSON.parse(fs.readFileSync(path.resolve(SA_KEY_FILE), 'utf8'));
    const credentials = {
        client_email: keyData.client_email,
        private_key: keyData.private_key
    };

    analyticsDataClient = new BetaAnalyticsDataClient({ credentials });

    // Create a JWT auth client for the Admin API
    googleAuthClient = new google.auth.JWT(
        keyData.client_email,
        null,
        keyData.private_key,
        ['https://www.googleapis.com/auth/analytics.readonly']
    );

    console.log(`Successfully loaded service account key for: ${keyData.client_email}`);
} catch (err) {
    console.error(`Error loading service account key file: ${err.message}`);
    process.exit(1);
}

/**
 * Fetch pageviews data for a specific GA4 property
 * @param {string} propertyId - The GA4 property ID
 * @returns {Promise<{propertyId: string, propertyName: string, pageviews: number, pageviewsFormatted: string}>} - The property details and pageviews
 */
async function fetchPropertyPageViews(propertyId) {
    // Calculate dates for yesterday and today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    try {
        // First get the property name using Admin API
        const propertyName = await fetchPropertyName(propertyId);

        // Run the report to get pageviews
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: formatDate(yesterday),
                    endDate: formatDate(today),
                },
            ],
            metrics: [
                {
                    name: 'screenPageViews',
                },
            ],
        });

        if (response && response.rows && response.rows.length) {
            const pageviews = parseInt(response.rows[0].metricValues[0].value, 10);
            // Return property details and pageviews count
            return {
                propertyId,
                propertyName,
                pageviews,
                pageviewsFormatted: formatNumberWithCommas(pageviews)
            };
        } else {
            return {
                propertyId,
                propertyName,
                pageviews: 0,
                pageviewsFormatted: "0"
            };
        }
    } catch (error) {
        console.error(`Error fetching data for property ${propertyId}:`, error.message);

        // Try to get property name even if pageviews request fails
        try {
            const propertyName = await fetchPropertyName(propertyId);
            return {
                propertyId,
                propertyName,
                error: error.message,
                pageviews: null,
                pageviewsFormatted: null
            };
        } catch (nameError) {
            return {
                propertyId,
                propertyName: `Property ${propertyId}`,
                error: error.message,
                pageviews: null,
                pageviewsFormatted: null
            };
        }
    }
}

/**
 * Fetch pageviews data for multiple GA4 properties
 * @param {string[]} propertyIds - Array of GA4 property IDs
 * @returns {Promise<Array>} - Array of property results
 */
async function fetchMultiplePropertyPageViews(propertyIds) {
    try {
        // Use Promise.all to fetch data for all properties in parallel
        const results = await Promise.all(
            propertyIds.map(propertyId => fetchPropertyPageViews(propertyId))
        );
        return results;
    } catch (error) {
        console.error('Error fetching multiple properties:', error.message);
        throw error;
    }
}

// API endpoint to get pageviews for a single property (maintaining backwards compatibility)
app.get('/api/pageviews/:propertyId', async (req, res) => {
    try {
        const propertyId = req.params.propertyId;

        if (!propertyId) {
            return res.status(400).json({
                error: 'Property ID is required'
            });
        }

        console.log(`Fetching pageviews for property: ${propertyId}`);
        const result = await fetchPropertyPageViews(propertyId);

        if (result.error) {
            throw { code: 500, message: result.error };
        }

        // Return just the number to maintain backward compatibility
        res.json({ pageviews: result.pageviews });
    } catch (error) {
        console.error('Error processing request:', error);

        if (error.code === 400) {
            return res.status(400).json({
                error: 'Invalid property ID format'
            });
        } else if (error.code === 401 || error.code === 403) {
            return res.status(403).json({
                error: 'Authentication error. Please check the service account permissions.'
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
});

// NEW API endpoint to get pageviews for multiple properties
app.get('/api/pageviews', async (req, res) => {
    try {
        // Get property IDs from query parameter
        // Example: /api/pageviews?ids=123456789,987654321
        const propertyIdsParam = req.query.ids;

        if (!propertyIdsParam) {
            return res.status(400).json({
                error: 'Property IDs are required. Use the "ids" query parameter with comma-separated values.'
            });
        }

        // Split comma-separated IDs and remove any whitespace
        const propertyIds = propertyIdsParam.split(',').map(id => id.trim());

        if (propertyIds.length === 0) {
            return res.status(400).json({
                error: 'At least one property ID is required'
            });
        }

        console.log(`Fetching pageviews for properties: ${propertyIds.join(', ')}`);
        const results = await fetchMultiplePropertyPageViews(propertyIds);

        // Return results with property IDs and pageviews
        res.json({
            properties: results,
            total: results.reduce((sum, property) => {
                return sum + (property.pageviews || 0);
            }, 0)
        });
    } catch (error) {
        console.error('Error processing multi-property request:', error);

        if (error.code === 400) {
            return res.status(400).json({
                error: 'Invalid property ID format'
            });
        } else if (error.code === 401 || error.code === 403) {
            return res.status(403).json({
                error: 'Authentication error. Please check the service account permissions.'
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
});

// NEW API endpoint to accept property IDs in POST request body
app.post('/api/pageviews', async (req, res) => {
    try {
        // Get property IDs from request body
        const { propertyIds } = req.body;

        if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
            return res.status(400).json({
                error: 'Property IDs array is required in request body'
            });
        }

        console.log(`Fetching pageviews for properties (POST): ${propertyIds.join(', ')}`);
        const results = await fetchMultiplePropertyPageViews(propertyIds);

        // Return results with property IDs and pageviews
        res.json({
            properties: results,
            total: results.reduce((sum, property) => {
                return sum + (property.pageviews || 0);
            }, 0)
        });
    } catch (error) {
        console.error('Error processing multi-property request:', error);

        if (error.code === 400) {
            return res.status(400).json({
                error: 'Invalid property ID format'
            });
        } else if (error.code === 401 || error.code === 403) {
            return res.status(403).json({
                error: 'Authentication error. Please check the service account permissions.'
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error'
            });
        }
    }
});

// Simple health check endpoint
app.get('/healthcheck', (req, res) => {
    res.json({ status: 'ok' });
});

// Root endpoint with basic info
app.get('/', (req, res) => {
    res.json({
        name: 'GA4 Pageviews API',
        description: 'API to fetch pageviews from Google Analytics 4',
        endpoints: [
            {
                path: '/api/pageviews/:propertyId',
                description: 'Get pageviews for a specific GA4 property',
                method: 'GET',
                params: {
                    propertyId: 'GA4 property ID (required)'
                }
            },
            {
                path: '/api/pageviews?ids=id1,id2,id3',
                description: 'Get pageviews for multiple GA4 properties using GET',
                method: 'GET',
                query: {
                    ids: 'Comma-separated list of GA4 property IDs (required)'
                }
            },
            {
                path: '/api/pageviews',
                description: 'Get pageviews for multiple GA4 properties using POST',
                method: 'POST',
                body: {
                    propertyIds: 'Array of GA4 property IDs (required)'
                }
            },
            {
                path: '/healthcheck',
                description: 'Simple health check endpoint',
                method: 'GET'
            }
        ]
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`GA4 Pageviews API is running on port ${PORT}`);
    console.log(`Service account: ${SA_KEY_FILE}`);
    console.log(`Try accessing: http://localhost:${PORT}/api/pageviews?ids=ID1,ID2,ID3`);
});