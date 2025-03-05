import { Service } from 'typedi';
import ScenarioRepository from '../database/repositories/ScenarioRepository';
import {
    AriesOOBAction,
    Scenario,
    NewAriesOOBAction,
    NewScenario,
    NewStep,
    Step,
    ScenarioFindAllArgs
} from '../types';

@Service()
class IssuanceFlowService {
    constructor(private readonly scenarioRepository: ScenarioRepository) {}

    public getScenarios = async (args: ScenarioFindAllArgs): Promise<Scenario[]> => {
        return this.scenarioRepository.findAll(args)
    };

    public getScenario = async (scenarioId: string): Promise<Scenario> => {
        return this.scenarioRepository.findById(scenarioId)
    };

    public createScenario = async (scenario: NewScenario): Promise<Scenario> => {
        return this.scenarioRepository.create(scenario)
    };

    public updateScenario = async (scenarioId: string, scenario: NewScenario): Promise<Scenario> => {
        return this.scenarioRepository.update(scenarioId, scenario)
    };

    public deleteScenario = async (scenarioId: string): Promise<void> => {
        return this.scenarioRepository.delete(scenarioId)
    };

    public getScenarioSteps = async (scenarioId: string): Promise<Step[]> => {
        return this.scenarioRepository.findAllSteps(scenarioId)
    };

    public getScenarioStep = async (scenarioId: string, stepId: string): Promise<Step> => {
        return this.scenarioRepository.findByStepId(scenarioId, stepId)
    };

    public createScenarioStep = async (scenarioId: string, step: NewStep): Promise<Step> => {
        return this.scenarioRepository.createStep(scenarioId, step)
    };

    public updateScenarioStep = async (scenarioId: string, stepId: string, step: NewStep): Promise<Step> => {
        return this.scenarioRepository.updateStep(scenarioId, stepId, step)
    };

    public deleteScenarioStep = async (scenarioId: string, stepId: string): Promise<void> => {
        return this.scenarioRepository.deleteStep(scenarioId, stepId)
    };

    public getScenarioStepActions = async (scenarioId: string, stepId: string): Promise<AriesOOBAction[]> => {
        return this.scenarioRepository.findAllStepActions(scenarioId, stepId)
    };

    public getScenarioStepAction = async (scenarioId: string, stepId: string, actionId: string): Promise<AriesOOBAction> => {
        return this.scenarioRepository.findByStepActionId(scenarioId, stepId, actionId)
    };

    public createScenarioStepAction = async (scenarioId: string, stepId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> => {
        return this.scenarioRepository.createStepAction(scenarioId, stepId, action)
    };

    public updateScenarioStepAction = async (scenarioId: string, stepId: string, actionId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> => {
        return this.scenarioRepository.updateStepAction(scenarioId, stepId, actionId, action)
    };

    public deleteScenarioStepAction = async (scenarioId: string, stepId: string, actionId: string): Promise<void> => {
        return this.scenarioRepository.deleteStepAction(scenarioId, stepId, actionId)
    };
}

export default IssuanceFlowService
