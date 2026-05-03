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

describe('Job - Create Job Validation', () => {

    test('rejects job creation with missing title', async () => {
        const res = await request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${token}`)
            .send({
                description: 'Fix my sink',
                category: 'Plumbing',
                budget: 5000,
                deadline: '2026-12-01'
            });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/required/i);
    });

    test('rejects job creation with missing description', async () => {
        const res = await request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Fix sink',
                category: 'Plumbing',
                budget: 5000,
                deadline: '2026-12-01'
            });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/required/i);
    });

    test('rejects job creation with missing budget', async () => {
        const res = await request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Fix sink',
                description: 'Fix my sink',
                category: 'Plumbing',
                deadline: '2026-12-01'
            });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/required/i);
    });

    test('rejects job creation without token', async () => {
        const res = await request(app)
            .post('/api/jobs')
            .send({
                title: 'Fix sink',
                description: 'Fix my sink',
                category: 'Plumbing',
                budget: 5000,
                deadline: '2026-12-01'
            });
        expect(res.status).toBe(401);
    });

});

describe('Job - Get Jobs', () => {

    test('returns list of open jobs', async () => {
        const res = await request(app)
            .get('/api/jobs')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('returns 400 for nearby jobs without lat/lng', async () => {
        const res = await request(app)
            .get('/api/jobs/nearby')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/required/i);
    });

    test('returns jobs near a location', async () => {
        const res = await request(app)
            .get('/api/jobs/nearby?lat=6.9271&lng=79.8612&maxDistanceKm=50')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('returns 404 for non-existent job ID', async () => {
        const res = await request(app)
            .get('/api/jobs/507f1f77bcf86cd799439011')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    test('returns my jobs for authenticated user', async () => {
        const res = await request(app)
            .get('/api/jobs/my')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

});