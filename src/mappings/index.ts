import { config } from '../config/config';
import { migrationMappings as productionMappings } from './production.mapping';
import { migrationMappings as testMappings } from './test.mapping';

export const migrationMappings = config.mode === 'test' ? testMappings : productionMappings;