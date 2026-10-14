import {initRepro} from '../../shared/page';
import * as assertive from './variants/assertive';
import * as polite from './variants/polite';
import * as setTimeoutVariant from './variants/set-timeout';
import * as textFirst from './variants/text-first';
import * as group from './variants/group';
import * as divWithId from './variants/div-with-id';

initRepro({
  defaultVariant: 'assertive',
  variants: {
    assertive: assertive.setup,
    polite: polite.setup,
    'set-timeout': setTimeoutVariant.setup,
    'text-first': textFirst.setup,
    group: group.setup,
    'div-with-id': divWithId.setup,
  },
});
