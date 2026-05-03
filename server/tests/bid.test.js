const request = require('supertest');
const app = require('../index');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../src/models/user');

let token;

beforeAll(async () => {
    // Wait for DB to connect
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Find any existing user in your DB to use for testing
    const user = await User.findOne({});
    if (!user) throw new Error('No users found in DB. Add a user first.');

    // Generate a valid token for that real user
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    console.log('🧪 Testing with user:', user.email);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Bid Validation Tests', () => {

    test('rejects non-numeric estimated time', async () => {
        const res = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token}`)
            .send({ jobId: '507f1f77bcf86cd799439011', price: 1000, estimatedTime: 'bljkbl.' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/positive number/i);
    });

    test('rejects zero as estimated time', async () => {
        const res = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token}`)
            .send({ jobId: '507f1f77bcf86cd799439011', price: 1000, estimatedTime: '0' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/positive number/i);
    });

    test('rejects negative estimated time', async () => {
        const res = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token}`)
            .send({ jobId: '507f1f77bcf86cd799439011', price: 1000, estimatedTime: '-5' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/positive number/i);
    });

    test('rejects missing price', async () => {
        const res = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token}`)
            .send({ jobId: '507f1f77bcf86cd799439011', estimatedTime: '3 hours' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/price/i);
    });

    test('rejects missing jobId', async () => {
        const res = await request(app)
            .post('/api/bids')
            .set('Authorization', `Bearer ${token}`)
            .send({ price: 1000, estimatedTime: '3 hours' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/jobId/i);
    });

});