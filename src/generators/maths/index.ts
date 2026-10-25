import type { Generator } from '../types';
import { DERIVATION_GENERATORS } from './derivation';
import { ANALYSE_GENERATORS } from './analyse';
import { AUTRES_GENERATORS } from './autres';
import { EXPERTES_GENERATORS } from './expertes';
import { recurrenceBlanks } from './recurrence';

export const MATHS_GENERATORS: Generator[] = [...DERIVATION_GENERATORS, ...ANALYSE_GENERATORS, ...AUTRES_GENERATORS, ...EXPERTES_GENERATORS, recurrenceBlanks];
