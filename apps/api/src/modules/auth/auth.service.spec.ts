import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const mockPrisma = { user: { findUnique: jest.fn(), create: jest.fn() }, authToken: { create: jest.fn() }, session: { create: jest.fn() } };
  const prisma = mockPrisma as never;
  const jwt = { signAsync: jest.fn() } as unknown as JwtService;
  const service = new AuthService(prisma, jwt);

  beforeEach(() => jest.clearAllMocks());
  it('normalizes email before creating an account', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'user-1', name: 'Ava', email: 'ava@example.com' });
    mockPrisma.authToken.create.mockResolvedValue({});
    const result = await service.register({ name: 'Ava', email: ' AVA@EXAMPLE.COM ', password: 'a-secure-password' });
    expect(result.user.email).toBe('ava@example.com');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: 'ava@example.com' }) }));
  });
  it('rejects a duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    await expect(service.register({ name: 'Ava', email: 'ava@example.com', password: 'a-secure-password' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects invalid login credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'ava@example.com', password: 'a-secure-password' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
