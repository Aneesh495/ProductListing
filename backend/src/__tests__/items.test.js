const request = require('supertest');
const app = require('../index');
const fs = require('fs').promises;
const path = require('path');

const TEST_DATA_PATH = path.join(__dirname, '../../data/items.json');

// Mock data for testing
const testItem = {
  name: 'Test Item',
  price: 9.99,
  description: 'A test item'
};

describe('Items API', () => {
  let originalData;

  // Save original data and add test item before tests
  beforeAll(async () => {
    const data = await fs.readFile(TEST_DATA_PATH, 'utf8');
    originalData = JSON.parse(data);
    
    // Add test item
    const testItems = [...originalData];
    testItems.push({
      ...testItem,
      id: 9999,
      createdAt: new Date().toISOString()
    });
    
    await fs.writeFile(TEST_DATA_PATH, JSON.stringify(testItems, null, 2));
  });

  // Restore original data after tests
  afterAll(async () => {
    await fs.writeFile(TEST_DATA_PATH, JSON.stringify(originalData, null, 2));
  });

  describe('GET /api/items', () => {
    it('should return paginated items', async () => {
      const res = await request(app)
        .get('/api/items')
        .query({ page: 1, limit: 5 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 5);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should search items by name', async () => {
      const res = await request(app)
        .get('/api/items')
        .query({ q: 'test' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some(item => 
        item.name.toLowerCase().includes('test'))
      ).toBe(true);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return a single item', async () => {
      const res = await request(app).get('/api/items/9999');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 9999);
      expect(res.body).toMatchObject({
        name: testItem.name,
        price: testItem.price
      });
    });

    it('should return 404 for non-existent item', async () => {
      const res = await request(app).get('/api/items/999999');
      
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('GET /api/items/stats', () => {
    it('should return statistics', async () => {
      const res = await request(app).get('/api/items/stats');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('min');
      expect(res.body).toHaveProperty('max');
      expect(res.body).toHaveProperty('average');
      expect(res.body).toHaveProperty('median');
      expect(res.body).toHaveProperty('priceDistribution');
    });

    it('should return cached response on subsequent calls', async () => {
      const firstRes = await request(app).get('/api/items/stats');
      const secondRes = await request(app)
        .get('/api/items/stats')
        .set('If-None-Match', firstRes.headers.etag);
      
      expect(secondRes.statusCode).toEqual(304); // Not Modified
    });
  });

  describe('POST /api/items', () => {
    const newItem = {
      name: 'New Test Item',
      price: 19.99,
      description: 'A new test item'
    };

    it('should create a new item', async () => {
      const res = await request(app)
        .post('/api/items')
        .send(newItem);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toMatchObject(newItem);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should return 400 for invalid item data', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Invalid' }); // Missing price
      
      expect(res.statusCode).toEqual(400);
    });
  });
});
