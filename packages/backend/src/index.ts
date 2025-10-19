// Backend service for geocoding and routing
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const MAPTILER_KEY = process.env.MAPTILER_KEY || 'IR034Q32N8Pnp6fBDlqy';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Geocode address to coordinates
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }
    
    const response = await axios.get(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(String(address))}.json?key=${MAPTILER_KEY}`
    );
    
    if (!response.data.features || response.data.features.length === 0) {
      return res.status(404).json({ error: 'No location found for this address' });
    }
    
    const feature = response.data.features[0];
    const coordinates = feature.center;
    const placeName = feature.place_name;
    
    res.status(200).json({
      coordinates,
      placeName,
      fullResponse: response.data
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// Reverse geocode coordinates to address
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude parameters are required' });
    }
    
    const response = await axios.get(
      `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_KEY}`
    );
    
    if (!response.data.features || response.data.features.length === 0) {
      return res.status(404).json({ error: 'No address found for these coordinates' });
    }
    
    const feature = response.data.features[0];
    const placeName = feature.place_name;
    
    res.status(200).json({
      placeName,
      fullResponse: response.data
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Failed to reverse geocode coordinates' });
  }
});

// Get location suggestions based on search input
app.get('/api/location-suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || String(query).trim().length < 2) {
      return res.status(400).json({ error: 'Query parameter is required (min 2 characters)' });
    }
    
    const response = await axios.get(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(String(query))}.json?key=${MAPTILER_KEY}`
    );
    
    if (!response.data.features) {
      return res.status(404).json({ error: 'No suggestions found' });
    }
    
    const suggestions = response.data.features.map((feature: any) => ({
      name: feature.text || '',
      fullAddress: feature.place_name || '',
      coordinates: feature.center
    })).slice(0, 5); // Limit to 5 suggestions
    
    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get location suggestions' });
  }
});

// Get route between two points
app.get('/api/route', async (req, res) => {
  try {
    const { 
      pickupLongitude, 
      pickupLatitude, 
      dropoffLongitude, 
      dropoffLatitude 
    } = req.query;
    
    if (!pickupLongitude || !pickupLatitude || !dropoffLongitude || !dropoffLatitude) {
      return res.status(400).json({ error: 'All coordinate parameters are required' });
    }
    
    // Set a timeout for the request to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000); // Increased timeout for OpenRouteService
    
    // OpenRouteService API key
    const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImVhNmRhMTkyYjVlNTQwYmJhZjhmMzNiZjkxZjM4YjI3IiwiaCI6Im11cm11cjY0In0=';
    
    try {
      // OpenRouteService uses a different URL structure with start and end coordinates
      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/driving-car`,
        { 
          params: {
            api_key: ORS_API_KEY,
            start: `${pickupLongitude},${pickupLatitude}`,
            end: `${dropoffLongitude},${dropoffLatitude}`
          },
          signal: controller.signal 
        }
      );
      
      clearTimeout(timeout);
      
      if (!response.data.features || response.data.features.length === 0) {
        return res.status(404).json({ error: 'No route found between these points' });
      }
      
      // Extract route from OpenRouteService response
      const route = response.data.features[0];
      const routeGeometry = route.geometry;
      const routeProperties = route.properties.segments[0];
      
      res.status(200).json({
        route: {
          // OpenRouteService returns GeoJSON geometry
          geometry: routeGeometry,
          // Convert from meters to appropriate units
          distance: routeProperties.distance,
          // Convert from seconds to appropriate units
          duration: routeProperties.duration
        },
        fullResponse: response.data
      });
    } catch (error) {
      clearTimeout(timeout);
      
      const axiosError = error as any;
      if (axiosError?.name === 'AbortError' || axiosError?.code === 'ECONNABORTED') {
        return res.status(408).json({ error: 'Route calculation timed out' });
      }
      
      throw error; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Routing error:', error);
    res.status(500).json({ error: 'Failed to get route' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;