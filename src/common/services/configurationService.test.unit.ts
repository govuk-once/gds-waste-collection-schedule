import { createMockObservabilityService } from '@project/_testHelpers/mockHelpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { ConfigurationService } from './configurationService';

// --- FIXED AWS MOCK ---
const sendMock = vi.fn();

vi.mock('@aws-sdk/client-ssm', () => {
  return {
    SSMClient: vi.fn().mockImplementation(function () {
      return { send: sendMock };
    }),
    GetParametersByPathCommand: vi.fn(),
  };
});


describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(() => {
    process.env.PREFIX = 'test-prefix';
    sendMock.mockReset();
    service = new ConfigurationService(createMockObservabilityService());
  });

  it('fetches namespace and stores parameters in cache', async () => {
    sendMock.mockResolvedValueOnce({
      Parameters: [
        { Name: '/test-prefix/foo', Value: 'bar' },
        { Name: '/test-prefix/baz', Value: 'qux' },
      ],
      NextToken: undefined,
    });

    await service.fetchNamespace();

    expect(service['inMemoryCache'].get('/test-prefix/foo')).toBe('bar');
    expect(service['inMemoryCache'].get('/test-prefix/baz')).toBe('qux');
  });

  it('handles pagination when fetching namespace', async () => {
    sendMock
      .mockResolvedValueOnce({
        Parameters: [{ Name: '/test-prefix/a', Value: '1' }],
        NextToken: 'NEXT',
      })
      .mockResolvedValueOnce({
        Parameters: [{ Name: '/test-prefix/b', Value: '2' }],
        NextToken: undefined,
      });

    await service.fetchNamespace();

    expect(service['inMemoryCache'].get('/test-prefix/a')).toBe('1');
    expect(service['inMemoryCache'].get('/test-prefix/b')).toBe('2');
  });

  it('retrieves a parameter from cache after namespace fetch', async () => {
    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/myParam', Value: 'hello' }],
    });

    const value = await service.getParameter('myParam');
    expect(value).toBe('hello');
  });

  it('throws when parameter is missing', async () => {
    sendMock.mockResolvedValueOnce({
      Parameters: [],
    });

    await expect(service.getParameter('missing')).rejects.toThrow('Returned parameter has no value');
  });

  it('parses boolean parameters correctly', async () => {
    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/flag', Value: 'true' }],
    });

    expect(await service.getBooleanParameter('flag')).toBe(true);
  });

  it('throws on invalid boolean parameter', async () => {
    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/flag', Value: 'not-a-bool' }],
    });

    await expect(service.getBooleanParameter('flag')).rejects.toThrow('Could not parse parameter flag to a boolean');
  });

  it('parses numeric parameters correctly', async () => {
    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/num', Value: '42' }],
    });

    expect(await service.getNumericParameter('num')).toBe(42);
  });

  it('throws on invalid numeric parameter', async () => {
    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/num', Value: 'abc' }],
    });

    await expect(service.getNumericParameter('num')).rejects.toThrow('Could not parse parameter num to a number');
  });

  it('parses enum parameters correctly', async () => {
    const schema = z.enum(['A', 'B', 'C']);

    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/choice', Value: 'B' }],
    });

    expect(await service.getEnumParameter('choice', schema)).toBe('B');
  });

  it('throws on invalid enum parameter', async () => {
    const schema = z.enum(['A', 'B', 'C']);

    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/choice', Value: 'Z' }],
    });

    await expect(service.getEnumParameter('choice', schema)).rejects.toThrow(
      'Could not parse parameter choice to a enum'
    );
  });

  it('parses JSON parameters into typed objects', async () => {
    const schema = z.object({
      enabled: z.boolean(),
      retries: z.number(),
    });

    sendMock.mockResolvedValueOnce({
      Parameters: [
        {
          Name: '/test-prefix/config',
          Value: JSON.stringify({ enabled: true, retries: 3 }),
        },
      ],
    });

    const result = await service.getParameterAsType('config', schema);
    expect(result).toEqual({ enabled: true, retries: 3 });
  });

  it('throws on invalid JSON parameter', async () => {
    const schema = z.object({ enabled: z.boolean() });

    sendMock.mockResolvedValueOnce({
      Parameters: [{ Name: '/test-prefix/config', Value: 'not-json' }],
    });

    await expect(service.getParameterAsType('config', schema)).rejects.toThrow(
      'Could not parse parameter config to type.'
    );
  });
});
