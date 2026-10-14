import {initRepro} from '../../shared/page';
import * as newRegion from './variants/new-region';
import * as delayedText from './variants/delayed-text';
import * as existingRegion from './variants/existing-region';

initRepro({
  defaultVariant: 'new-region',
  variants: {
    'new-region': newRegion.setup,
    'delayed-text': delayedText.setup,
    'existing-region': existingRegion.setup,
  },
});
