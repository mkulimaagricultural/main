import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePost, loadPostMedia } from '../lib/posts.js';
import { onRequestPost, IMAGE_LIMIT, VIDEO_LIMIT } from '../functions/admin/api/uploads.js';
import { onRequestGet as serveMedia } from '../functions/api/media/[key].js';

// Node's test runner does not expose the Workers FixedLengthStream primitive.
const originalFixedLengthStream = globalThis.FixedLengthStream;
globalThis.FixedLengthStream = class FixedLengthStream {
  constructor(expectedSize) {
    let written = 0;
    const stream = new TransformStream({
      transform(chunk, controller) {
        written += chunk.byteLength;
        if (written > expectedSize) throw new Error('Too many bytes');
        controller.enqueue(chunk);
      },
      flush() {
        if (written !== expectedSize) throw new Error('Too few bytes');
      }
    });
    this.readable = stream.readable;
    this.writable = stream.writable;
  }
};
test.after(() => {
  if (originalFixedLengthStream === undefined) delete globalThis.FixedLengthStream;
  else globalThis.FixedLengthStream = originalFixedLengthStream;
});

const valid = { title_en: 'New update', title_sw: 'Taarifa', body_en: 'English body',
  body_sw: 'Maelezo', status: 'draft', image_url: '' };
const photo = '/api/media/12345678-1234-1234-1234-123456789abc.jpg';
const video = '/api/media/abcdef12-1234-1234-1234-123456789abc.mp4';

test('a post accepts multiple images and videos in order, derives legacy cover', () => {
  const media = Array.from({ length: 150 }, () => ({ url: photo, type: 'image' }));
  media.push({ url: video, type: 'video' });
  const result = validatePost({ ...valid, media });
  assert.equal(result.post.media.length, 151);
  assert.equal(result.post.image_url, photo);
  assert.equal(validatePost({ ...valid, media: [{ url: video, type: 'video' }] }).post.image_url, '');
});

test('post validation retains legacy posts and blocks invalid attachment URLs', () => {
  assert.deepEqual(validatePost({ ...valid, image_url: '/assets/img/founders-meeting.jpg' }).post.media,
    [{ url: '/assets/img/founders-meeting.jpg', type: 'image' }]);
  assert.ok(validatePost({ ...valid, media: [{ url: 'https://attacker.test/a.mp4', type: 'video' }] }).error);
  assert.ok(validatePost({ ...valid, media: [{ url: photo, type: 'video' }] }).error);
  assert.ok(validatePost({ ...valid, media: 'wrong' }).error);
});

test('media loader returns stored order and safely falls back to original image', async () => {
  const posts = [{ id: 'one', image_url: '/assets/img/founders-meeting.jpg' }, { id: 'two', image_url: '' }];
  const db = { prepare: () => ({
    bind: (...ids) => {
      assert.deepEqual(ids, ['one', 'two']);
      return { all: async () => ({ results: [
        { post_id: 'two', media_url: video, media_type: 'video' },
        { post_id: 'two', media_url: photo, media_type: 'image' }
      ] }) };
    }
  }) };
  await loadPostMedia(db, posts);
  assert.equal(posts[0].media[0].url, '/assets/img/founders-meeting.jpg');
  assert.deepEqual(posts[1].media, [{ url: video, type: 'video' }, { url: photo, type: 'image' }]);
});

function pngBytes(size = 20) {
  const bytes = new Uint8Array(size);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  return bytes;
}
function mp4Bytes() {
  return Uint8Array.from([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0]);
}
function makeRequest(type, bytes, sizeOverride) {
  const headers = { 'Content-Type': type, 'X-File-Size': String(sizeOverride ?? bytes.byteLength) };
  if (sizeOverride !== undefined) headers['Content-Length'] = String(sizeOverride);
  return new Request('https://admin.mkulimaagricultural.org/admin/api/uploads', {
    method: 'POST', headers, body: bytes, duplex: 'half'
  });
}

test('image and video uploads are streamed into R2 with validated metadata', async () => {
  const objects = [];
  const env = { MEDIA: { async put(key, stream, options) {
    let size = 0;
    for await (const chunk of stream) size += chunk.length;
    objects.push({ key, size, type: options.httpMetadata.contentType });
  } } };
  const data = { admin: { role: 'admin' } };
  const a = await onRequestPost({ request: makeRequest('image/png', pngBytes()), env, data });
  assert.equal(a.status, 201);
  assert.equal((await a.json()).media_type, 'image');
  const b = await onRequestPost({ request: makeRequest('video/mp4', mp4Bytes()), env, data });
  assert.equal(b.status, 201);
  assert.equal((await b.json()).media_type, 'video');
  assert.deepEqual(objects.map((item) => item.type), ['image/png', 'video/mp4']);
  assert.equal(objects[1].size, 16);
});

test('upload rejects spoofed media and over-limit image or video', async () => {
  const env = { MEDIA: { put() { throw new Error('Should not store invalid files'); } } };
  const data = { admin: { role: 'admin' } };
  const spoof = await onRequestPost({ request: makeRequest('video/mp4', pngBytes()), env, data });
  assert.equal(spoof.status, 400);
  const largePhoto = await onRequestPost({ request: makeRequest('image/png', pngBytes(), IMAGE_LIMIT + 1), env, data });
  assert.equal(largePhoto.status, 413);
  const largeVideo = await onRequestPost({ request: makeRequest('video/mp4', mp4Bytes(), VIDEO_LIMIT + 1), env, data });
  assert.equal(largeVideo.status, 413);
});

test('video reads support HTTP byte ranges for seeking', async () => {
  const bytes = Uint8Array.from([4, 5, 6]);
  const response = await serveMedia({
    params: { key: 'abcdef12-1234-1234-1234-123456789abc.mp4' },
    request: new Request('https://mkulimaagricultural.org/api/media/test.mp4', { headers: { Range: 'bytes=4-6' } }),
    env: { MEDIA: { async get(key, options) {
      assert.equal(options.range.get('Range'), 'bytes=4-6');
      return {
        body: new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } }),
        size: 10, range: { offset: 4, length: 3 },
        writeHttpMetadata(h) { h.set('Content-Type', 'video/mp4'); }
      };
    } } }
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 4-6/10');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});
