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

describe('Messages - Mark Read Validation', () => {

    test('rejects mark-read with missing bookingId', async () => {
        const res = await request(app)
            .put('/api/messages/mark-read')
            .send({ userId: testUser._id.toString() });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    test('rejects mark-read with missing userId', async () => {
        const res = await request(app)
            .put('/api/messages/mark-read')
            .send({ bookingId: '507f1f77bcf86cd799439011' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    test('rejects mark-read with invalid ObjectId format', async () => {
        const res = await request(app)
            .put('/api/messages/mark-read')
            .send({ bookingId: 'not-valid-id', userId: 'also-not-valid' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid/i);
    });

    test('accepts mark-read with valid ObjectIds', async () => {
        const res = await request(app)
            .put('/api/messages/mark-read')
            .send({
                bookingId: '507f1f77bcf86cd799439011',
                userId: testUser._id.toString()
            });
        // 200 means it ran (even if 0 messages were updated — that's fine)
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

});

describe('Messages - Get Chat History', () => {

    test('rejects invalid bookingId format', async () => {
        const res = await request(app)
            .get('/api/messages/invalid-id');
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid/i);
    });

    test('returns empty array for valid but non-existent bookingId', async () => {
        const res = await request(app)
            .get('/api/messages/507f1f77bcf86cd799439011');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.messages)).toBe(true);
    });

});

describe('Messages - Get Conversations', () => {

    test('returns conversations for a valid userId', async () => {
        const res = await request(app)
            .get(`/api/messages/conversations/${testUser._id}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.conversations)).toBe(true);
    });

    test('rejects invalid userId format for conversations', async () => {
        const res = await request(app)
            .get('/api/messages/conversations/not-a-valid-id');
        expect(res.status).toBe(500); // MongoDB throws on invalid ObjectId cast
    });

});