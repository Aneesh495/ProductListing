const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Cache for items data
let itemsCache = {
  data: null,
  lastModified: 0,
  stats: null,
  statsTimestamp: 0
};

// Utility to read data with caching
async function readData() {
  try {
    const stats = await fs.stat(DATA_PATH);
    
    // Return cached data if file hasn't changed
    if (itemsCache.data && stats.mtimeMs <= itemsCache.lastModified) {
      return itemsCache.data;
    }
    
    // Read and parse the file
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const data = JSON.parse(raw);
    
    // Update cache
    itemsCache = {
      ...itemsCache,
      data,
      lastModified: stats.mtimeMs
    };
    
    return data;
  } catch (error) {
    console.error('Error reading data:', error);
    throw error;
  }
}

// Calculate statistics
function calculateStats(items) {
  if (!items.length) return null;
  
  const prices = items.map(item => item.price).sort((a, b) => a - b);
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = sum / prices.length;
  const median = prices.length % 2 === 0
    ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
    : prices[Math.floor(prices.length / 2)];
    
  // Price distribution (buckets)
  const maxPrice = Math.max(...prices);
  const bucketSize = Math.ceil(maxPrice / 5);
  const distribution = Array(5).fill(0);
  
  prices.forEach(price => {
    const bucket = Math.min(Math.floor(price / bucketSize), 4);
    distribution[bucket]++;
  });
  
  return {
    count: items.length,
    min: prices[0],
    max: prices[prices.length - 1],
    average: parseFloat(avg.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    priceDistribution: distribution.map((count, i) => ({
      range: `${i * bucketSize} - ${(i + 1) * bucketSize}`,
      count
    }))
  };
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, q } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const items = await readData();
    let results = [...items];
    
    // Apply search filter
    if (q) {
      const searchTerm = q.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Calculate pagination
    const total = results.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedResults = results.slice(startIndex, startIndex + limitNum);
    
    res.json({
      data: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/stats
router.get('/stats', async (req, res, next) => {
  try {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    
    // Return cached stats if still valid
    if (itemsCache.stats && (now - itemsCache.statsTimestamp) < CACHE_DURATION) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      return res.json({
        ...itemsCache.stats,
        cached: true,
        lastUpdated: new Date(itemsCache.statsTimestamp).toISOString()
      });
    }
    
    const data = await readData();
    const stats = calculateStats(data);
    
    // Update cache
    itemsCache.stats = stats;
    itemsCache.statsTimestamp = now;
    
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json({
      ...stats,
      cached: false,
      lastUpdated: new Date(now).toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const item = req.body;
    
    // Basic validation
    if (!item.name || typeof item.price !== 'number') {
      const err = new Error('Invalid item data');
      err.status = 400;
      throw err;
    }
    
    const data = await readData();
    const newItem = {
      ...item,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    data.push(newItem);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    
    // Invalidate cache
    itemsCache.lastModified = 0;
    itemsCache.stats = null;
    
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

module.exports = router;