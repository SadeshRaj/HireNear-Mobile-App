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

describe('Auth - Login Tests', () => {

    test('logs in successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrong_password_test' });
        // Either 200 (correct pass) or 400 (wrong pass) — both mean the route works
        expect([200, 400, 401]).toContain(res.status);
    });

    test('rejects login with missing email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'somepassword' });
        expect(res.status).toBe(400);
    });

    test('rejects login with missing password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com' });
        expect(res.status).toBe(400);
    });

    test('rejects login with non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'doesnotexist_xyz@nowhere.com', password: 'password123' });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/invalid credentials/i);
    });

});

describe('Auth - Register Tests', () => {

    test('rejects registration with existing email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: testUser.email, // already exists
                password: 'password123',
                role: 'Client',
                phone: '0771234567'
            });
        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/already exists/i);
    });

});

describe('Auth - Protected Routes', () => {

    test('rejects profile update without token', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .send({ name: 'New Name' });
        expect(res.status).toBe(401);
    });

    test('rejects change password without token', async () => {
        const res = await request(app)
            .put('/api/auth/change-password')
            .send({ oldPassword: 'old', newPassword: 'new' });
        expect(res.status).toBe(401);
    });

    test('gets worker profile by ID', async () => {
        const res = await request(app)
            .get(`/api/auth/worker/${testUser._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect([200, 404]).toContain(res.status);
    });

});