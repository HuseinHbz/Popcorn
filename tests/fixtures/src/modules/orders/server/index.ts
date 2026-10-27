import { ORDER_STATUSES } from '../domain/order';
import { findOrder } from './repository';

export const createOrder = (): string => findOrder(ORDER_STATUSES[0]);
