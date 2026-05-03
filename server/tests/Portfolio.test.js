const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../src/models/user');
const jwt = require('jsonwebtoken');

let token;
let testUser;

beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    testUser = await User.findOne({});
    token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Portfolio - Authentication', () => {

    test('rejects get portfolio without token', async () => {
        const res = await request(app)
            .get('/api/portfolio');
        expect(res.status).toBe(401);
    });

    test('rejects create portfolio without token', async () => {
        const res = await request(app)
            .post('/api/portfolio')
            .send({ title: 'My Work', description: 'Description' });
        expect(res.status).toBe(401);
    });

    test('rejects delete portfolio without token', async () => {
        const res = await request(app)
            .delete('/api/portfolio/507f1f77bcf86cd799439011');
        expect(res.status).toBe(401);
    });

    test('rejects update portfolio without token', async () => {
        const res = await request(app)
            .put('/api/portfolio/507f1f77bcf86cd799439011')
            .send({ title: 'Updated' });
        expect(res.status).toBe(401);
    });

});

describe('Portfolio - Create Validation', () => {

    test('rejects creation with missing title', async () => {
        const res = await request(app)
            .post('/api/portfolio')
            .set('Authorization', `Bearer ${token}`)
            .send({ description: 'Some description' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/required/i);
    });

    test('rejects creation with missing description', async () => {
        const res = await request(app)
            .post('/api/portfolio')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'My Work' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/required/i);
    });

    test('rejects creation with no image', async () => {
        const res = await request(app)
            .post('/api/portfolio')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'My Work', description: 'Some description' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/image/i);
    });

    test('rejects creation with missing both title and description', async () => {
        const res = await request(app)
            .post('/api/portfolio')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/required/i);
    });

});

describe('Portfolio - Get Portfolio', () => {

    test('returns portfolio list for authenticated user', async () => {
        const res = await request(app)
            .get('/api/portfolio')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('returns portfolio for a specific worker ID', async () => {
        const res = await request(app)
            .get(`/api/portfolio/${testUser._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('returns empty array for worker with no portfolio', async () => {
        const fakeWorkerId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/portfolio/${fakeWorkerId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

});

describe('Portfolio - Delete Portfolio Item', () => {

    test('returns 404 for non-existent portfolio item', async () => {
        const res = await request(app)
            .delete('/api/portfolio/507f1f77bcf86cd799439011')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.msg).toMatch(/not found/i);
    });

});

describe('Portfolio - Update Portfolio Item', () => {

    test('returns 404 for non-existent portfolio item update', async () => {
        const res = await request(app)
            .put('/api/portfolio/507f1f77bcf86cd799439011')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Title' });
        expect(res.status).toBe(404);
        expect(res.body.msg).toMatch(/not found/i);
    });

});