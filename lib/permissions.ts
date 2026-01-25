import type { Role } from '@prisma/client';

export function canWrite(role: Role) {
  return role === 'ADMIN' || role === 'DESIGNER';
}

export function assertWrite(role: Role) {
  if (!canWrite(role)) {
    const err = Object.assign(new Error('Forbidden'), { statusCode: 403 });
    throw err;
  }
}
