import { faker } from '@faker-js/faker';
import type { NewArticle } from '../types/api';

/** Always produces a unique title, so slug collisions never make a test flaky. */
export function buildArticle(overrides: Partial<NewArticle> = {}): NewArticle {
  const unique = `${Date.now()}_${faker.string.alphanumeric(6)}`;
  return {
    title: `Test Article ${unique}`,
    description: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
    tagList: ['automation'],
    ...overrides,
  };
}
