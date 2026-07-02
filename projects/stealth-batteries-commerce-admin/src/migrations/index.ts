import * as migration_20240321_add_force_password_change from './20240321_add_force_password_change'
import * as migration_20240326_create_shipping_config from './20240326_create_shipping_config'
import * as migration_20240326_make_search_shipping_details_nullable from './20240326_make_search_shipping_details_nullable'
import * as migration_20250401_222713_add_tracking_fields from './20250401_222713_add_tracking_fields'
import * as migration_20250424_181500_fix_event_dates_final from './20250424_181500_fix_event_dates_final'
import * as migration_20250509_180725 from './20250509_180725'

export const migrations = [
  {
    up: migration_20240321_add_force_password_change.up,
    down: migration_20240321_add_force_password_change.down,
    name: '20240321_add_force_password_change',
  },
  {
    up: migration_20240326_create_shipping_config.up,
    down: migration_20240326_create_shipping_config.down,
    name: '20240326_create_shipping_config',
  },
  {
    up: migration_20240326_make_search_shipping_details_nullable.up,
    down: migration_20240326_make_search_shipping_details_nullable.down,
    name: '20240326_make_search_shipping_details_nullable',
  },
  {
    up: migration_20250401_222713_add_tracking_fields.up,
    down: migration_20250401_222713_add_tracking_fields.down,
    name: '20250401_222713_add_tracking_fields',
  },
  {
    up: migration_20250424_181500_fix_event_dates_final.up,
    down: migration_20250424_181500_fix_event_dates_final.down,
    name: '20250424_181500_fix_event_dates_final',
  },
  {
    up: migration_20250509_180725.up,
    down: migration_20250509_180725.down,
    name: '20250509_180725',
  },
]
