import { Service } from 'typedi'
import PresentationFlowRepository from '../database/repositories/PresentationFlowRepository'
import { PresentationFlow, NewPresentationFlow, NewStep, NewAriesOOBAction, Step, AriesOOBAction } from '../types'

@Service()
class PresentationFlowService {
  constructor(private readonly presentationFlowRepository: PresentationFlowRepository) {}

  // PRESENTATION FLOW

  public getPresentationFlows = async (): Promise<PresentationFlow[]> => {
    return this.presentationFlowRepository.findAll()
  }

  public getPresentationFlow = async (presentationFlowId: string): Promise<PresentationFlow> => {
    return this.presentationFlowRepository.findById(presentationFlowId)
  }

  public createPresentationFlow = async (presentationFlow: NewPresentationFlow): Promise<PresentationFlow> => {
    return this.presentationFlowRepository.create(presentationFlow)
  }

  public updatePresentationFlow = async (presentationFlowId: string, presentationFlow: NewPresentationFlow): Promise<PresentationFlow> => {
    return this.presentationFlowRepository.update(presentationFlowId, presentationFlow)
  }

  public deletePresentationFlow = async (presentationFlowId: string): Promise<void> => {
    return this.presentationFlowRepository.delete(presentationFlowId)
  }

  // PRESENTATION FLOW STEP

  public getPresentationFlowSteps = async (presentationFlowId: string): Promise<Step[]> => {
    return this.presentationFlowRepository.findAllSteps(presentationFlowId)
  }

  public getPresentationFlowStep = async (presentationFlowId: string, stepId: string): Promise<Step> => {
    return this.presentationFlowRepository.findByStepId(presentationFlowId, stepId)
  }

  public createPresentationFlowStep = async (presentationFlowId: string, step: NewStep): Promise<Step> => {
    return this.presentationFlowRepository.createStep(presentationFlowId, step)
  }

  public updatePresentationFlowStep = async (presentationFlowId: string, stepId: string, step: NewStep): Promise<Step> => {
    return this.presentationFlowRepository.updateStep(presentationFlowId, stepId, step)
  }

  public deletePresentationFlowStep = async (presentationFlowId: string, stepId: string): Promise<void> => {
    return this.presentationFlowRepository.deleteStep(presentationFlowId, stepId)
  }

  // PRESENTATION FLOW STEP ACTION

  public getPresentationFlowStepActions = async (presentationFlowId: string, stepId: string): Promise<AriesOOBAction[]> => {
    return this.presentationFlowRepository.findAllStepActions(presentationFlowId, stepId)
  }

  public getPresentationFlowStepAction = async (presentationFlowId: string, stepId: string, actionId: string): Promise<AriesOOBAction> => {
    return this.presentationFlowRepository.findByStepActionId(presentationFlowId, stepId, actionId)
  }

  public createPresentationFlowStepAction = async (
    presentationFlowId: string,
    stepId: string,
    action: NewAriesOOBAction,
  ): Promise<AriesOOBAction> => {
    return this.presentationFlowRepository.createStepAction(presentationFlowId, stepId, action)
  }

  public updatePresentationFlowStepAction = async (
    presentationFlowId: string,
    stepId: string,
    actionId: string,
    action: NewAriesOOBAction,
  ): Promise<AriesOOBAction> => {
    return this.presentationFlowRepository.updateStepAction(presentationFlowId, stepId, actionId, action)
  }

  public deletePresentationFlowStepAction = async (presentationFlowId: string, stepId: string, actionId: string): Promise<void> => {
    return this.presentationFlowRepository.deleteStepAction(presentationFlowId, stepId, actionId)
  }
}

export default PresentationFlowService
