import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { Request } from 'express';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.getOrThrow.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should extract token from Authentication cookie', () => {
    const mockRequest = {
      cookies: {
        Authentication: 'test-jwt-token',
      },
    } as unknown as Request;

    const extractors = (strategy as any)._jwtFromRequest;
    const token = extractors(mockRequest);

    expect(token).toBe('test-jwt-token');
  });

  it('should return null when Authentication cookie not present', () => {
    const mockRequest = {
      cookies: {
        OtherCookie: 'value',
      },
    } as unknown as Request;

    const extractors = (strategy as any)._jwtFromRequest;
    const token = extractors(mockRequest);

    expect(token).toBeNull();
  });

  it('should return null when cookies object missing', () => {
    const mockRequest = {} as Request;

    const extractors = (strategy as any)._jwtFromRequest;
    const token = extractors(mockRequest);

    expect(token).toBeNull();
  });

  it('should validate payload and return token payload', () => {
    const mockPayload = {
      sub: 1,
      stravaId: 12345,
    };

    const result = strategy.validate(mockPayload);

    expect(result).toEqual(mockPayload);
    expect(result.sub).toBe(1);
    expect(result.stravaId).toBe(12345);
  });

  it('should use JWT_ACCESS_TOKEN_SECRET from config', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_ACCESS_TOKEN_SECRET');
  });

  it('should throw error if JWT_ACCESS_TOKEN_SECRET not configured', () => {
    const mockConfigServiceThrows = {
      getOrThrow: jest.fn().mockImplementation(() => {
        throw new Error('Configuration key JWT_ACCESS_TOKEN_SECRET not found');
      }),
    };

    expect(() => {
      new JwtStrategy(mockConfigServiceThrows as any);
    }).toThrow('Configuration key JWT_ACCESS_TOKEN_SECRET not found');
  });
});
