/** Registers subject-specific review screens for SRS item kinds. */
import { registerReview } from './registry';
import { SesPlanReview } from '../ses/Ec1';

registerReview('ses-plan', SesPlanReview);
import { ChecklistReview } from '../blurting/Blurting';
import { PhiloNotionReview } from '../philo/Philo';
import { HgChronoReview } from '../hg/Hg';

registerReview('checklist', ChecklistReview);
registerReview('philo-notion', PhiloNotionReview);
registerReview('hg-event', HgChronoReview);
