import {initRepro} from '../../shared/page';
import * as naive from './variants/naive';
import * as newElement from './variants/new-element';
import * as twoRegions from './variants/two-regions';
import * as oneRegion from './variants/one-region';
import * as debounce from './variants/debounce';
import * as append from './variants/append';

initRepro({
  defaultVariant: 'naive',
  variants: {
    naive: naive.setup,
    'new-element': newElement.setup,
    'two-regions': twoRegions.setup,
    'one-region': oneRegion.setup,
    debounce: debounce.setup,
    append: append.setup,
  },
});
