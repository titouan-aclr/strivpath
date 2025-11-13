import type { User } from '@/lib/graphql';

export const createMockUser = (overrides?: Partial<User>): User => {
  const now = new Date();

  return {
    id: '1',
    stravaId: 12345678,
    username: 'john_doe',
    firstname: 'John',
    lastname: 'Doe',
    profile: 'https://ui-avatars.com/api/?name=John+Doe&size=512&background=FC4C02&color=fff&bold=true',
    profileMedium: 'https://ui-avatars.com/api/?name=John+Doe&size=256&background=FC4C02&color=fff&bold=true',
    city: 'San Francisco',
    country: 'United States',
    sex: 'M',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const MOCK_USERS = {
  john: createMockUser(),
  jane: createMockUser({
    id: '2',
    stravaId: 87654321,
    username: 'jane_smith',
    firstname: 'Jane',
    lastname: 'Smith',
    profile: 'https://ui-avatars.com/api/?name=Jane+Smith&size=512&background=E94B3C&color=fff&bold=true',
    profileMedium: 'https://ui-avatars.com/api/?name=Jane+Smith&size=256&background=E94B3C&color=fff&bold=true',
    city: 'New York',
    country: 'United States',
    sex: 'F',
  }),
  noProfile: createMockUser({
    id: '3',
    stravaId: 11111111,
    username: 'no_profile',
    firstname: 'No',
    lastname: 'Profile',
    profile: null,
    profileMedium: null,
    city: null,
    country: null,
    sex: null,
  }),
};
