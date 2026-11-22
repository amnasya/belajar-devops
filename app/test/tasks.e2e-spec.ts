import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Task tracker API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tasks membuat task baru dengan done=false', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'a' })
      .expect(201);
    expect(res.body).toMatchObject({ title: 'a', done: false });
    expect(typeof res.body.id).toBe('number');
  });

  it('POST /tasks dengan judul kosong -> 400', async () => {
    await request(app.getHttpServer()).post('/tasks').send({ title: '' }).expect(400);
  });

  it('POST /tasks dengan judul 201 karakter -> 400', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'x'.repeat(201) })
      .expect(400);
  });

  it('GET /tasks mengembalikan daftar yang berisi task baru', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'daftar' });
    const res = await request(app.getHttpServer()).get('/tasks').expect(200);
    expect(res.body.some((t: { id: number }) => t.id === created.body.id)).toBe(true);
  });

  it('PATCH /tasks/:id mengubah done', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'centang' });
    const res = await request(app.getHttpServer())
      .patch(`/tasks/${created.body.id}`)
      .send({ done: true })
      .expect(200);
    expect(res.body.done).toBe(true);
  });

  it('PATCH /tasks/999999 -> 404', async () => {
    await request(app.getHttpServer())
      .patch('/tasks/999999')
      .send({ done: true })
      .expect(404);
  });

  it('DELETE /tasks/:id -> 204 lalu hilang dari daftar', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'hapus' });
    await request(app.getHttpServer()).delete(`/tasks/${created.body.id}`).expect(204);
    const res = await request(app.getHttpServer()).get('/tasks');
    expect(res.body.some((t: { id: number }) => t.id === created.body.id)).toBe(false);
  });

  it('DELETE /tasks/999999 -> 404', async () => {
    await request(app.getHttpServer()).delete('/tasks/999999').expect(404);
  });

  it('GET /health -> {status:"ok"}', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /metrics berisi http_requests_total', async () => {
    await request(app.getHttpServer()).get('/tasks');
    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toMatch(/http_requests_total\{[^}]*route="\/tasks"[^}]*\} \d+/);
  });
});
