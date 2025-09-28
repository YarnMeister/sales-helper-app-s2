export { ContactFactory } from './contact-factory';
export { LineItemFactory } from './line-item-factory';
export { RequestFactory } from './request-factory';
export { DBRequestFactory } from './db-request-factory';
export type { TestRequestDB } from './db-request-factory';
export type { TContactJSON } from './contact-factory';
export type { TLineItem } from './line-item-factory';
export type { TRequestUpsert } from './request-factory';

// Import the classes first
import { ContactFactory } from './contact-factory';
import { LineItemFactory } from './line-item-factory';
import { RequestFactory } from './request-factory';
import { DBRequestFactory } from './db-request-factory';

// Convenience instances
export const contactFactory = new ContactFactory();
export const lineItemFactory = new LineItemFactory();
export const requestFactory = new RequestFactory();
export const dbRequestFactory = new DBRequestFactory();
