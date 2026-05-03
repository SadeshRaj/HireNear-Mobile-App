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

describe('Booking - Authentication', () => {

    test('rejects get worker bookings without token', async () => {
        const res = await request(app)
            .get('/api/bookings/worker');
        expect(res.status).toBe(401);
    });

    test('rejects get booking by job ID without token', async () => {
        const res = await request(app)
            .get('/api/bookings/job/507f1f77bcf86cd799439011');
        expect(res.status).toBe(401);
    });

    test('rejects status update without token', async () => {
        const res = await request(app)
            .patch('/api/bookings/507f1f77bcf86cd799439011/status')
            .send({ status: 'completed' });
        expect(res.status).toBe(401);
    });

});

describe('Booking - Get Worker Bookings', () => {

    test('returns bookings list for authenticated worker', async () => {
        const res = await request(app)
            .get('/api/bookings/worker')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.bookings)).toBe(true);
    });

});

describe('Booking - Get Booking by Job ID', () => {

    test('returns 404 for non-existent job booking', async () => {
        const res = await request(app)
            .get('/api/bookings/job/507f1f77bcf86cd799439011')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

});

describe('Booking - Update Status', () => {

    test('returns 404 for non-existent booking status update', async () => {
        const res = await request(app)
            .patch('/api/bookings/507f1f77bcf86cd799439011/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'completed' });
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

});