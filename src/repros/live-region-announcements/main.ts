import {initRepro} from '../../shared/page';
import * as naive from './variants/naive';
import * as debounce from './variants/debounce';
import * as queue from './variants/queue';

initRepro({
  defaultVariant: 'naive',
  variants: {
    naive: naive.setup,
    debounce: debounce.setup,
    queue: queue.setup,
  },
});
