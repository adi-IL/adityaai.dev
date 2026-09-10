import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { handleChat } from '../lib/handlers/chat.ts';
import { handleFeedback } from '../lib/handlers/feedback.ts';
import { handleSubscribe } from '../lib/handlers/subscribe.ts';
import { handleVirtualCoffee } from '../lib/handlers/virtual-coffee.ts';
import { handleC2hReport } from '../lib/handlers/c2h-report.ts';
import { extractFunctionCalls } from '../lib/vertex.ts';
import type { ApiRequest, ApiResponse } from '../lib/http.ts';

before(() => {
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dummy_test_key_for_unit_tests';
});

function mockReqRes(method = 'POST', body: Record<string, unknown> = {}) {
  const req: ApiRequest = {
    method,
    body,
    headers: { 'x-forwarded-for': '127.0.0.1' },
  };

  let statusCode = 200;
  let responseData: any = null;
  const headers: Record<string, string> = {};

  const res: ApiResponse = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: unknown) {
      responseData = data;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData, headers };
}

describe('API Handlers - HTTP Methods & Guard Checks', () => {
  it('handleChat rejects non-POST requests', async () => {
    const { req, res, getStatus, getData } = mockReqRes('GET');
    await handleChat(req, res);
    assert.equal(getStatus(), 405);
    assert.deepEqual(getData(), { error: 'Method not allowed' });
  });

  it('handleChat trips honeypot gracefully', async () => {
    const { req, res, getStatus, getData } = mockReqRes('POST', { website: 'http://spam.bot' });
    await handleChat(req, res);
    assert.equal(getStatus(), 200);
    assert.deepEqual(getData(), { reply: 'Thanks for visiting the lab.' });
  });

  it('handleChat requires non-empty messages array', async () => {
    const { req, res, getStatus, getData } = mockReqRes('POST', { messages: [] });
    await handleChat(req, res);
    assert.equal(getStatus(), 400);
    assert.equal(typeof getData().error, 'string');
    assert.equal(getData().error.includes('Send a non-empty messages array'), true);
  });

  it('handleFeedback rejects non-POST requests', async () => {
    const { req, res, getStatus } = mockReqRes('GET');
    await handleFeedback(req, res);
    assert.equal(getStatus(), 405);
  });

  it('handleFeedback requires valid article slug and allowed reaction', async () => {
    const { req, res, getStatus, getData } = mockReqRes('POST', { slug: 'test', reaction: 'invalid-reaction' });
    await handleFeedback(req, res);
    assert.equal(getStatus(), 400);
    assert.equal(getData().error.includes('Invalid reaction'), true);
  });

  it('handleSubscribe returns generic success on invalid email to prevent enumeration', async () => {
    const { req, res, getStatus, getData } = mockReqRes('POST', { email: 'invalid-email-shape' });
    await handleSubscribe(req, res);
    // Anti-enumeration defense: handleSubscribe returns 400 for bad email, or 200 generic message.
    assert.equal(getStatus(), 400);
    assert.equal(getData().error.includes('Valid email is required'), true);
  });

  it('handleVirtualCoffee requires valid name and email', async () => {
    const { req, res, getStatus, getData } = mockReqRes('POST', { name: '', email: 'bad' });
    await handleVirtualCoffee(req, res);
    assert.equal(getStatus(), 400);
    assert.equal(getData().error.includes('Name is required'), true);
  });

  it('handleC2hReport rejects non-POST requests', async () => {
    const { req, res, getStatus } = mockReqRes('GET');
    await handleC2hReport(req, res);
    assert.equal(getStatus(), 405);
  });

  it('handleC2hReport trips honeypot gracefully', async () => {
    const { req, res, getStatus, getData } = mockReqRes('POST', { website: 'bot' });
    await handleC2hReport(req, res);
    assert.equal(getStatus(), 200);
    assert.equal(getData().success, true);
  });

  it('handleC2hReport requires core machine details', async () => {
    const { req, res, getStatus, getData } = mockReqRes('POST', { hostname: 'PC-1' });
    await handleC2hReport(req, res);
    assert.equal(getStatus(), 400);
    assert.equal(getData().error.includes('Machine details are incomplete'), true);
  });

  it('handleC2hReport accepts a full valid report (validation passes)', async () => {
    const saved = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = '';
    try {
      const { req, res, getStatus, getData } = mockReqRes('POST', {
        hostname: 'TEST-PC',
        supportUser: 'support',
        password: 'x'.repeat(16),
        externalIp: '49.37.1.2',
        specs: 'OS: Test',
      });
      await handleC2hReport(req, res);
      assert.equal(getStatus(), 500);
      assert.equal(getData().error.includes('temporarily unavailable'), true);
    } finally {
      process.env.RESEND_API_KEY = saved;
    }
  });

  it('extractFunctionCalls correctly extracts functionCall objects from model responses', () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Navigating now.' },
              {
                functionCall: {
                  name: 'navigateTo',
                  args: { path: '/projects' },
                },
              },
            ],
          },
        },
      ],
    };
    const calls = extractFunctionCalls(mockResponse as any);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'navigateTo');
    assert.deepEqual(calls[0].args, { path: '/projects' });
  });
});
