import { WorkflowType } from '../schema';

export type ScenarioFindAllArgs = {
    filter: ScenarioFilter
}

export type ScenarioFilter = {
    scenarioType: WorkflowType
}
