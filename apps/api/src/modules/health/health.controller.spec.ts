import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a valid service health response', () => {
    const response = new HealthController().getHealth();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('api');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
