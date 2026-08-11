export { createPasswordGenerator } from './generator';
export type { PasswordGeneratorConfig, ValidationResult, PasswordGenerator } from './generator';

import { createPasswordGenerator } from './generator';

/** Singleton password generator instance — single source of truth. */
export const passwordGenerator = createPasswordGenerator();
