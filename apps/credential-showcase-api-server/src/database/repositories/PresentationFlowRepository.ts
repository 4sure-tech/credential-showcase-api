import { and, eq, inArray } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import AssetRepository from './AssetRepository'
import RelyingPartyRepository from './RelyingPartyRepository'
import PersonaRepository from './PersonaRepository'
import { NotFoundError } from '../../errors'
import { ariesProofRequests, assets, credentialDefinitions, stepActions, steps, workflows, workflowsToPersonas } from '../schema'
import { sortSteps } from '../../utils/sortUtils'
import {
  PresentationFlow,
  NewPresentationFlow,
  NewStep,
  NewAriesOOBAction,
  RepositoryDefinition,
  Step,
  AriesOOBAction,
  WorkflowType,
} from '../../types'

@Service()
class PresentationFlowRepository implements RepositoryDefinition<PresentationFlow, NewPresentationFlow> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetRepository: AssetRepository,
    private readonly relyingPartyRepository: RelyingPartyRepository,
    private readonly personaRepository: PersonaRepository,
  ) {}

  // PRESENTATION FLOW

  async create(presentationFlow: NewPresentationFlow): Promise<PresentationFlow> {
    if (presentationFlow.steps.length === 0) {
      return Promise.reject(Error('At least one step is required'))
    }
    if (presentationFlow.personas.length === 0) {
      return Promise.reject(Error('At least one persona is required'))
    }
    const personaPromises = presentationFlow.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const relyingPartyResult = await this.relyingPartyRepository.findById(presentationFlow.relyingParty)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<PresentationFlow> => {
      const [presentationFlowResult] = await tx
        .insert(workflows)
        .values({
          name: presentationFlow.name,
          description: presentationFlow.description,
          relyingParty: relyingPartyResult.id,
          workflowType: WorkflowType.PRESENTATION,
        })
        .returning()

      const workflowsToPersonasResult = await tx
        .insert(workflowsToPersonas)
        .values(
          presentationFlow.personas.map((personaId: string) => ({
            workflow: presentationFlowResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          credentialDefinitions.id,
          workflowsToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      const stepsResult = await tx
        .insert(steps)
        .values(
          presentationFlow.steps.map((step: NewStep) => ({
            ...step,
            workflow: presentationFlowResult.id,
          })),
        )
        .returning()

      const stepActionsResult = await tx
        .insert(stepActions)
        .values(
          stepsResult.flatMap((stepResult, index) =>
            presentationFlow.steps[index].actions.map((action) => ({
              ...action,
              step: stepResult.id,
            })),
          ),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          presentationFlow.steps.flatMap((step, index) =>
            step.actions.map((action, actionIndex) => {
              const stepAction = stepActionsResult[index * step.actions.length + actionIndex]
              return {
                ...action.proofRequest,
                stepAction: stepAction.id,
              }
            }),
          ),
        )
        .returning()

      const stepAssetsResult = await tx.query.assets.findMany({
        where: inArray(
          assets.id,
          stepsResult.map((step) => step.asset).filter((assetId) => assetId !== null),
        ),
      })

      const flowSteps = stepsResult.map((stepResult) => ({
        ...stepResult,
        actions: stepActionsResult
          .filter((stepActionResult) => stepActionResult.step === stepResult.id)
          .map((action) => ({
            ...action,
            proofRequest: proofRequestsResult.find((proofRequest) => proofRequest.stepAction === action.id),
          })),
        asset: stepAssetsResult.find((asset) => asset.id === stepResult.asset),
      }))

      return {
        ...presentationFlowResult,
        steps: sortSteps(flowSteps),
        relyingParty: relyingPartyResult,
        personas: personasResult,
      }
    })
  }

  async delete(presentationFlowId: string): Promise<void> {
    await this.findById(presentationFlowId)
    await (await this.databaseService.getConnection()).delete(workflows).where(eq(workflows.id, presentationFlowId))
  }

  async update(presentationFlowId: string, presentationFlow: NewPresentationFlow): Promise<PresentationFlow> {
    await this.findById(presentationFlowId)
    if (presentationFlow.steps.length === 0) {
      return Promise.reject(Error('At least one step is required'))
    }
    if (presentationFlow.personas.length === 0) {
      return Promise.reject(Error('At least one persona is required'))
    }
    const personaPromises = presentationFlow.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const relyingPartyResult = await this.relyingPartyRepository.findById(presentationFlow.relyingParty)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<PresentationFlow> => {
      const [presentationFlowResult] = await tx
        .update(workflows)
        .set({
          name: presentationFlow.name,
          description: presentationFlow.description,
          relyingParty: relyingPartyResult.id,
          workflowType: WorkflowType.PRESENTATION,
        })
        .where(eq(workflows.id, presentationFlowId))
        .returning()

      await tx.delete(workflowsToPersonas).where(eq(workflowsToPersonas.workflow, presentationFlowId))

      const workflowsToPersonasResult = await tx
        .insert(workflowsToPersonas)
        .values(
          presentationFlow.personas.map((personaId: string) => ({
            workflow: presentationFlowResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          credentialDefinitions.id,
          workflowsToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      await tx.delete(steps).where(eq(steps.workflow, presentationFlowId))

      const stepsResult = await tx
        .insert(steps)
        .values(
          presentationFlow.steps.map((step: NewStep) => ({
            ...step,
            workflow: presentationFlowResult.id,
          })),
        )
        .returning()

      const stepActionsResult = await tx
        .insert(stepActions)
        .values(
          stepsResult.flatMap((stepResult, index) =>
            presentationFlow.steps[index].actions.map((action) => ({
              ...action,
              step: stepResult.id,
            })),
          ),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          presentationFlow.steps.flatMap((step, index) =>
            step.actions.map((action, actionIndex) => {
              const stepAction = stepActionsResult[index * step.actions.length + actionIndex]
              return {
                ...action.proofRequest,
                stepAction: stepAction.id,
              }
            }),
          ),
        )
        .returning()

      const stepAssetsResult = await tx.query.assets.findMany({
        where: inArray(
          assets.id,
          stepsResult.map((step) => step.asset).filter((assetId) => assetId !== null),
        ),
      })

      const flowSteps = stepsResult.map((stepResult) => ({
        ...stepResult,
        actions: stepActionsResult
          .filter((stepActionResult) => stepActionResult.step === stepResult.id)
          .map((action) => ({
            ...action,
            proofRequest: proofRequestsResult.find((proofRequest) => proofRequest.stepAction === action.id),
          })),
        asset: stepAssetsResult.find((asset) => asset.id === stepResult.asset),
      }))

      return {
        ...presentationFlowResult,
        steps: sortSteps(flowSteps),
        relyingParty: relyingPartyResult,
        personas: personasResult,
      }
    })
  }

  async findById(presentationFlowId: string): Promise<PresentationFlow> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.workflows.findFirst({
      where: and(eq(workflows.id, presentationFlowId), eq(workflows.workflowType, WorkflowType.PRESENTATION)),
      with: {
        steps: {
          with: {
            actions: {
              with: {
                proofRequest: true,
              },
            },
            asset: true,
          },
        },
        relyingParty: {
          with: {
            credentialDefinitions: {
              with: {
                cd: {
                  with: {
                    icon: true,
                    attributes: true,
                    representations: true,
                    revocation: true,
                  },
                },
              },
            },
            logo: true,
          },
        },
        personas: {
          with: {
            persona: {
              with: {
                headshotImage: true,
                bodyImage: true,
              },
            },
          },
        },
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No presentation flow found for id: ${presentationFlowId}`))
    }

    return {
      ...result,
      steps: sortSteps(result.steps),
      relyingParty: {
        ...(result.relyingParty as any), // TODO check this typing issue at a later point in time
        credentialDefinitions: result.relyingParty!.credentialDefinitions.map((credentialDefinition) => credentialDefinition.cd),
      },
      personas: result.personas.map((item) => item.persona),
    }
  }

  async findAll(): Promise<PresentationFlow[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.workflows.findMany({
      where: eq(workflows.workflowType, WorkflowType.PRESENTATION),
      with: {
        steps: {
          with: {
            actions: {
              with: {
                proofRequest: true,
              },
            },
            asset: true,
          },
        },
        relyingParty: {
          with: {
            credentialDefinitions: {
              with: {
                cd: {
                  with: {
                    icon: true,
                    attributes: true,
                    representations: true,
                    revocation: true,
                  },
                },
              },
            },
            logo: true,
          },
        },
        personas: {
          with: {
            persona: {
              with: {
                headshotImage: true,
                bodyImage: true,
              },
            },
          },
        },
      },
    })

    return result.map((workflow: any) => ({
      ...workflow,
      steps: sortSteps(workflow.steps),
      issuer: {
        ...workflow.relyingParty,
        credentialDefinitions: workflow.relyingParty.credentialDefinitions.map((credentialDefinition: any) => credentialDefinition.cd), // TODO any
      },
      personas: workflow.personas.map((item: any) => item.persona), // TODO check this typing issue at a later point in time
    }))
  }

  // PRESENTATION FLOW STEP

  async createStep(presentationFlowId: string, step: NewStep): Promise<Step> {
    await this.findById(presentationFlowId)

    if (step.actions.length === 0) {
      return Promise.reject(Error('At least one action is required'))
    }

    const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
      const [stepResult] = await tx
        .insert(steps)
        .values({
          ...step,
          workflow: presentationFlowId,
        })
        .returning()

      const actionsResult = await tx
        .insert(stepActions)
        .values(
          step.actions.map((action: NewAriesOOBAction) => ({
            ...action,
            step: stepResult.id,
          })),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          step.actions.map((action, index) => {
            const stepAction = actionsResult[index]
            return {
              ...action.proofRequest,
              stepAction: stepAction.id,
            }
          }),
        )
        .returning()

      return {
        ...stepResult,
        actions: actionsResult.map((action) => ({
          ...action,
          proofRequest: proofRequestsResult.find((proofRequest) => proofRequest.stepAction === action.id),
        })),
        asset: assetResult,
      }
    })
  }

  async deleteStep(presentationFlowId: string, stepId: string): Promise<void> {
    await this.findByStepId(presentationFlowId, stepId)
    await (await this.databaseService.getConnection()).delete(steps).where(and(eq(steps.id, stepId), eq(steps.workflow, presentationFlowId)))
  }

  async updateStep(presentationFlowId: string, stepId: string, step: NewStep): Promise<Step> {
    await this.findById(presentationFlowId)

    if (step.actions.length === 0) {
      return Promise.reject(Error('At least one action is required'))
    }

    const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
      const [stepResult] = await tx
        .update(steps)
        .set({
          ...step,
          workflow: presentationFlowId,
        })
        .where(eq(steps.id, stepId))
        .returning()

      await tx.delete(stepActions).where(eq(stepActions.step, stepId))

      const actionsResult = await tx
        .insert(stepActions)
        .values(
          step.actions.map((action: NewAriesOOBAction) => ({
            ...action,
            step: stepResult.id,
          })),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          step.actions.map((action, index) => {
            const stepAction = actionsResult[index]
            return {
              ...action.proofRequest,
              stepAction: stepAction.id,
            }
          }),
        )
        .returning()

      return {
        ...stepResult,
        actions: actionsResult.map((action) => ({
          ...action,
          proofRequest: proofRequestsResult.find((proofRequest) => proofRequest.stepAction === action.id),
        })),
        asset: assetResult,
      }
    })
  }

  async findByStepId(presentationFlowId: string, stepId: string): Promise<Step> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.steps.findFirst({
      where: and(and(eq(steps.id, stepId), eq(steps.workflow, presentationFlowId))),
      with: {
        actions: {
          with: {
            proofRequest: true,
          },
        },
        asset: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No step found for presentation flow id: ${presentationFlowId} and step id: ${stepId}`))
    }

    return result
  }

  async findAllSteps(presentationFlowId: string): Promise<Step[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.steps.findMany({
      where: eq(steps.workflow, presentationFlowId),
      with: {
        asset: true,
        actions: {
          with: {
            proofRequest: true,
          },
        },
      },
    })

    return sortSteps(result)
  }

  // PRESENTATION FLOW STEP ACTION

  async createStepAction(presentationFlowId: string, stepId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
    await this.findByStepId(presentationFlowId, stepId)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<AriesOOBAction> => {
      const [actionResult] = await tx
        .insert(stepActions)
        .values({
          ...action,
          step: stepId,
        })
        .returning()

      const [proofRequestsResult] = await tx
        .insert(ariesProofRequests)
        .values({
          ...action.proofRequest,
          stepAction: actionResult.id,
        })
        .returning()

      return {
        ...actionResult,
        proofRequest: proofRequestsResult,
      }
    })
  }

  async deleteStepAction(presentationFlowId: string, stepId: string, actionId: string): Promise<void> {
    await this.findByStepActionId(presentationFlowId, stepId, actionId)
    await (await this.databaseService.getConnection()).delete(stepActions).where(and(eq(stepActions.id, actionId), eq(stepActions.step, stepId)))
  }

  async updateStepAction(presentationFlowId: string, stepId: string, actionId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
    await this.findByStepId(presentationFlowId, stepId)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<AriesOOBAction> => {
      const [actionResult] = await tx
        .update(stepActions)
        .set({
          ...action,
          step: stepId,
        })
        .where(eq(stepActions.id, actionId))
        .returning()

      await tx.delete(ariesProofRequests).where(eq(ariesProofRequests.stepAction, actionId))

      const [proofRequestsResult] = await tx
        .insert(ariesProofRequests)
        .values({
          ...action.proofRequest,
          stepAction: actionResult.id,
        })
        .returning()

      return {
        ...actionResult,
        proofRequest: proofRequestsResult,
      }
    })
  }

  async findByStepActionId(presentationFlowId: string, stepId: string, actionId: string): Promise<AriesOOBAction> {
    await this.findByStepId(presentationFlowId, stepId)
    const result = await (
      await this.databaseService.getConnection()
    ).query.stepActions.findFirst({
      where: and(eq(stepActions.id, actionId)),
      with: {
        proofRequest: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No action found for step id ${stepId} and action id: ${actionId}`))
    }

    return result
  }

  async findAllStepActions(presentationFlowId: string, stepId: string): Promise<AriesOOBAction[]> {
    await this.findByStepId(presentationFlowId, stepId)
    return (await this.databaseService.getConnection()).query.stepActions.findMany({
      where: and(eq(stepActions.step, stepId)),
      with: {
        proofRequest: true,
      },
    })
  }
}

export default PresentationFlowRepository
