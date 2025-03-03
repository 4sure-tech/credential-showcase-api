import { Service } from 'typedi'
import IssuanceFlowRepository from '../database/repositories/IssuanceFlowRepository'
import { IssuanceFlow, NewIssuanceFlow, NewStep, NewAriesOOBAction, Step, AriesOOBAction } from '../types'

@Service()
class IssuanceFlowService {
  constructor(private readonly issuanceFlowRepository: IssuanceFlowRepository) {}

  // ISSUANCE FLOW

  public getIssuanceFlows = async (): Promise<IssuanceFlow[]> => {
    return this.issuanceFlowRepository.findAll()
  }

  public getIssuanceFlow = async (issuanceFlowId: string): Promise<IssuanceFlow> => {
    return this.issuanceFlowRepository.findById(issuanceFlowId)
  }

  public createIssuanceFlow = async (issuanceFlow: NewIssuanceFlow): Promise<IssuanceFlow> => {
    return this.issuanceFlowRepository.create(issuanceFlow)
  }

  public updateIssuanceFlow = async (issuanceFlowId: string, issuanceFlow: NewIssuanceFlow): Promise<IssuanceFlow> => {
    return this.issuanceFlowRepository.update(issuanceFlowId, issuanceFlow)
  }

  public deleteIssuanceFlow = async (issuanceFlowId: string): Promise<void> => {
    return this.issuanceFlowRepository.delete(issuanceFlowId)
  }

  // ISSUANCE FLOW STEP

  public getIssuanceFlowSteps = async (issuanceFlowId: string): Promise<Step[]> => {
    return this.issuanceFlowRepository.findAllSteps(issuanceFlowId)
  }

  public getIssuanceFlowStep = async (issuanceFlowId: string, stepId: string): Promise<Step> => {
    return this.issuanceFlowRepository.findByStepId(issuanceFlowId, stepId)
  }

  public createIssuanceFlowStep = async (issuanceFlowId: string, step: NewStep): Promise<Step> => {
    return this.issuanceFlowRepository.createStep(issuanceFlowId, step)
  }

  public updateIssuanceFlowStep = async (issuanceFlowId: string, stepId: string, step: NewStep): Promise<Step> => {
    return this.issuanceFlowRepository.updateStep(issuanceFlowId, stepId, step)
  }

  public deleteIssuanceFlowStep = async (issuanceFlowId: string, stepId: string): Promise<void> => {
    return this.issuanceFlowRepository.deleteStep(issuanceFlowId, stepId)
  }

  // ISSUANCE FLOW STEP ACTION

  public getIssuanceFlowStepActions = async (issuanceFlowId: string, stepId: string): Promise<AriesOOBAction[]> => {
    return this.issuanceFlowRepository.findAllStepActions(issuanceFlowId, stepId)
  }

  public getIssuanceFlowStepAction = async (issuanceFlowId: string, stepId: string, actionId: string): Promise<AriesOOBAction> => {
    return this.issuanceFlowRepository.findByStepActionId(issuanceFlowId, stepId, actionId)
  }

  public createIssuanceFlowStepAction = async (issuanceFlowId: string, stepId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> => {
    return this.issuanceFlowRepository.createStepAction(issuanceFlowId, stepId, action)
  }

  public updateIssuanceFlowStepAction = async (
    issuanceFlowId: string,
    stepId: string,
    actionId: string,
    action: NewAriesOOBAction,
  ): Promise<AriesOOBAction> => {
    return this.issuanceFlowRepository.updateStepAction(issuanceFlowId, stepId, actionId, action)
  }

  public deleteIssuanceFlowStepAction = async (issuanceFlowId: string, stepId: string, actionId: string): Promise<void> => {
    return this.issuanceFlowRepository.deleteStepAction(issuanceFlowId, stepId, actionId)
  }
}

export default IssuanceFlowService
