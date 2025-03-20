import { executionControl } from '../config/execution-control.config';
import { migrationMappings as productionMappings } from './production.mapping';
import { migrationMappings as testMappings } from './test.mapping';

export const migrationMappings = executionControl.getMode() === 'test' ? testMappings : productionMappings;