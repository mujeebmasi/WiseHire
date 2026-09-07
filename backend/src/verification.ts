import { VerificationLevel } from '@prisma/client';

// Give each level a number so we can compare them with >=.
// This is the core rule of the whole app.
const LEVEL_VALUE = {
  NONE: 0,
  EMAIL: 1,
  GOVT_ID: 2,
};

// Is this user allowed to apply to a job that requires `required`?
export function isVerifiedEnough(
  userLevel: VerificationLevel,
  required: VerificationLevel,
): boolean {
  return LEVEL_VALUE[userLevel] >= LEVEL_VALUE[required];
}

// Friendly text for error messages and the UI.
export const LEVEL_TEXT = {
  NONE: 'not verified',
  EMAIL: 'email verified',
  GOVT_ID: 'government ID verified',
};
