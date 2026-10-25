/** Registers subject-specific review screens for SRS item kinds. */
import { registerReview } from './registry';
import { SesPlanReview } from '../ses/Ec1';

registerReview('ses-plan', SesPlanReview);
