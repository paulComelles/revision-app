import type { Generator } from '../types';
import { ALGEBRA_GENERATORS } from './algebra';
import { ADVANCED_GENERATORS } from './advanced';
import { PSDA_GENERATORS } from './psda';
import { GEOMETRY_GENERATORS } from './geometry';

export const SAT_GENERATORS: Generator[] = [...ALGEBRA_GENERATORS, ...ADVANCED_GENERATORS, ...PSDA_GENERATORS, ...GEOMETRY_GENERATORS];
