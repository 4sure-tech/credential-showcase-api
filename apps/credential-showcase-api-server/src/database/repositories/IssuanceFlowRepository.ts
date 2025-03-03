import { and, eq, inArray } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import AssetRepository from './AssetRepository'
import IssuerRepository from './IssuerRepository'
import PersonaRepository from './PersonaRepository'
import { NotFoundError } from '../../errors'
import { sortSteps } from '../../utils/sortUtils'
import { assets, workflowsToPersonas, stepActions, steps, workflows, credentialDefinitions, ariesProofRequests } from '../schema'
import { IssuanceFlow, NewIssuanceFlow, NewStep, NewAriesOOBAction, RepositoryDefinition, Step, AriesOOBAction, WorkflowType } from '../../types'

@Service()
class IssuanceFlowRepository implements RepositoryDefinition<IssuanceFlow, NewIssuanceFlow> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetRepository: AssetRepository,
    private readonly issuerRepository: IssuerRepository,
    private readonly personaRepository: PersonaRepository,
  ) {}

  // ISSUANCE FLOW

  async create(issuanceFlow: NewIssuanceFlow): Promise<IssuanceFlow> {
    if (issuanceFlow.steps.length === 0) {
      return Promise.reject(Error('At least one step is required'))
    }
    if (issuanceFlow.personas.length === 0) {
      return Promise.reject(Error('At least one persona is required'))
    }
    const personaPromises = issuanceFlow.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const issuerResult = await this.issuerRepository.findById(issuanceFlow.issuer)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<IssuanceFlow> => {
      const [issuanceFlowResult] = await tx
        .insert(workflows)
        .values({
          name: issuanceFlow.name,
          description: issuanceFlow.description,
          issuer: issuerResult.id,
          workflowType: WorkflowType.ISSUANCE,
        })
        .returning()

      const workflowsToPersonasResult = await tx
        .insert(workflowsToPersonas)
        .values(
          issuanceFlow.personas.map((personaId: string) => ({
            workflow: issuanceFlowResult.id,
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
          issuanceFlow.steps.map((step: NewStep) => ({
            ...step,
            workflow: issuanceFlowResult.id,
          })),
        )
        .returning()

      const stepActionsResult = await tx
        .insert(stepActions)
        .values(
          stepsResult.flatMap((stepResult, index) =>
            issuanceFlow.steps[index].actions.map((action) => ({
              ...action,
              step: stepResult.id,
            })),
          ),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          issuanceFlow.steps.flatMap((step, index) =>
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
        ...issuanceFlowResult,
        steps: sortSteps(flowSteps),
        issuer: issuerResult,
        personas: personasResult,
      }
    })
  }

  async delete(issuanceFlowId: string): Promise<void> {
    await this.findById(issuanceFlowId)
    await (await this.databaseService.getConnection()).delete(workflows).where(eq(workflows.id, issuanceFlowId))
  }

  async update(issuanceFlowId: string, issuanceFlow: NewIssuanceFlow): Promise<IssuanceFlow> {
    await this.findById(issuanceFlowId)
    if (issuanceFlow.steps.length === 0) {
      return Promise.reject(Error('At least one step is required'))
    }
    if (issuanceFlow.personas.length === 0) {
      return Promise.reject(Error('At least one persona is required'))
    }
    const personaPromises = issuanceFlow.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)
    const issuerResult = await this.issuerRepository.findById(issuanceFlow.issuer)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<IssuanceFlow> => {
      const [issuanceFlowResult] = await tx
        .update(workflows)
        .set({
          name: issuanceFlow.name,
          description: issuanceFlow.description,
          issuer: issuerResult.id,
          workflowType: WorkflowType.ISSUANCE,
        })
        .where(eq(workflows.id, issuanceFlowId))
        .returning()

      await tx.delete(workflowsToPersonas).where(eq(workflowsToPersonas.workflow, issuanceFlowId))

      const workflowsToPersonasResult = await tx
        .insert(workflowsToPersonas)
        .values(
          issuanceFlow.personas.map((personaId: string) => ({
            workflow: issuanceFlowResult.id,
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

      await tx.delete(steps).where(eq(steps.workflow, issuanceFlowId))

      const stepsResult = await tx
        .insert(steps)
        .values(
          issuanceFlow.steps.map((step: NewStep) => ({
            ...step,
            workflow: issuanceFlowResult.id,
          })),
        )
        .returning()

      const stepActionsResult = await tx
        .insert(stepActions)
        .values(
          stepsResult.flatMap((stepResult, index) =>
            issuanceFlow.steps[index].actions.map((action) => ({
              ...action,
              step: stepResult.id,
            })),
          ),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          issuanceFlow.steps.flatMap((step, index) =>
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
        ...issuanceFlowResult,
        steps: sortSteps(flowSteps),
        issuer: issuerResult,
        personas: personasResult,
      }
    })
  }

  async findById(issuanceFlowId: string): Promise<IssuanceFlow> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.workflows.findFirst({
      where: and(eq(workflows.id, issuanceFlowId), eq(workflows.workflowType, WorkflowType.ISSUANCE)),
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
        issuer: {
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
      return Promise.reject(new NotFoundError(`No issuance flow found for id: ${issuanceFlowId}`))
    }

    return {
      ...result,
      steps: sortSteps(result.steps),
      issuer: {
        ...(result.issuer as any), // TODO check this typing issue at a later point in time
        credentialDefinitions: result.issuer!.credentialDefinitions.map((credentialDefinition) => credentialDefinition.cd),
      },
      personas: result.personas.map((item) => item.persona),
    }
  }

  async findAll(): Promise<IssuanceFlow[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.workflows.findMany({
      where: eq(workflows.workflowType, WorkflowType.ISSUANCE),
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
        issuer: {
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
        ...workflow.issuer,
        credentialDefinitions: workflow.issuer.credentialDefinitions.map((credentialDefinition: any) => credentialDefinition.cd), // TODO check this typing issue at a later point in time
      },
      personas: workflow.personas.map((item: any) => item.persona), // TODO check this typing issue at a later point in time
    }))
  }

  // ISSUANCE FLOW STEP

  async createStep(issuanceFlowId: string, step: NewStep): Promise<Step> {
    await this.findById(issuanceFlowId)

    if (step.actions.length === 0) {
      return Promise.reject(Error('At least one action is required'))
    }

    const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
      const [stepResult] = await tx
        .insert(steps)
        .values({
          ...step,
          workflow: issuanceFlowId,
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

  async deleteStep(issuanceFlowId: string, stepId: string): Promise<void> {
    await this.findByStepId(issuanceFlowId, stepId)
    await (await this.databaseService.getConnection()).delete(steps).where(and(eq(steps.id, stepId), eq(steps.workflow, issuanceFlowId)))
  }

  async updateStep(issuanceFlowId: string, stepId: string, step: NewStep): Promise<Step> {
    await this.findById(issuanceFlowId)

    if (step.actions.length === 0) {
      return Promise.reject(Error('At least one action is required'))
    }

    const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
      const [stepResult] = await tx
        .update(steps)
        .set({
          ...step,
          workflow: issuanceFlowId,
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

  async findByStepId(issuanceFlowId: string, stepId: string): Promise<Step> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.steps.findFirst({
      where: and(and(eq(steps.id, stepId), eq(steps.workflow, issuanceFlowId))),
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
      return Promise.reject(new NotFoundError(`No step found for issuance flow id: ${issuanceFlowId} and step id: ${stepId}`))
    }

    return result
  }

  async findAllSteps(issuanceFlowId: string): Promise<Step[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.steps.findMany({
      where: eq(steps.workflow, issuanceFlowId),
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

  // ISSUANCE FLOW STEP ACTION

  async createStepAction(issuanceFlowId: string, stepId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
    await this.findByStepId(issuanceFlowId, stepId)

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

  async deleteStepAction(issuanceFlowId: string, stepId: string, actionId: string): Promise<void> {
    await this.findByStepActionId(issuanceFlowId, stepId, actionId)
    await (await this.databaseService.getConnection()).delete(stepActions).where(and(eq(stepActions.id, actionId), eq(stepActions.step, stepId)))
  }

  async updateStepAction(issuanceFlowId: string, stepId: string, actionId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
    await this.findByStepId(issuanceFlowId, stepId)

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

  async findByStepActionId(issuanceFlowId: string, stepId: string, actionId: string): Promise<AriesOOBAction> {
    await this.findByStepId(issuanceFlowId, stepId)
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

  async findAllStepActions(issuanceFlowId: string, stepId: string): Promise<AriesOOBAction[]> {
    await this.findByStepId(issuanceFlowId, stepId)
    return (await this.databaseService.getConnection()).query.stepActions.findMany({
      where: and(eq(stepActions.step, stepId)),
      with: {
        proofRequest: true,
      },
    })
  }
}

export default IssuanceFlowRepository
