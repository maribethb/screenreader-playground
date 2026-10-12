import {initRepro} from '../../shared/page';
import * as assertive from './variants/assertive';
import * as polite from './variants/polite';

initRepro({
  defaultVariant: 'assertive',
  variants: {
    assertive: assertive.setup,
    polite: polite.setup,
  },
});
