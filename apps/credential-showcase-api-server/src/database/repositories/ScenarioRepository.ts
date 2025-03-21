import { and, eq, inArray } from 'drizzle-orm'
import { Service } from 'typedi'
import { BadRequestError } from 'routing-controllers'
import DatabaseService from '../../services/DatabaseService'
import PersonaRepository from './PersonaRepository'
import IssuerRepository from './IssuerRepository'
import RelyingPartyRepository from './RelyingPartyRepository'
import AssetRepository from './AssetRepository'
import { isIssuanceScenario, isPresentationScenario } from '../../utils/mappers'
import { sortSteps } from '../../utils/sort'
import { generateSlug } from '../../utils/slug'
import { NotFoundError } from '../../errors'
import { ariesProofRequests, assets, credentialDefinitions, stepActions, steps, scenarios, scenariosToPersonas } from '../schema'
import {
  AriesOOBAction,
  Issuer,
  NewAriesOOBAction,
  NewIssuanceScenario,
  NewPresentationScenario,
  NewScenario,
  NewStep,
  RelyingParty,
  RepositoryDefinition,
  Scenario,
  ScenarioFindAllArgs,
  Step,
  ScenarioType,
} from '../../types'

@Service()
class ScenarioRepository implements RepositoryDefinition<Scenario, NewScenario> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personaRepository: PersonaRepository,
    private readonly issuerRepository: IssuerRepository,
    private readonly relyingPartyRepository: RelyingPartyRepository,
    private readonly assetRepository: AssetRepository,
  ) {}

  async create(scenario: NewScenario): Promise<Scenario> {
    if (scenario.steps.length === 0) {
      return Promise.reject(new BadRequestError('At least one step is required'))
    }
    if (scenario.personas.length === 0) {
      return Promise.reject(new BadRequestError('At least one persona is required'))
    }

    const bannerImageResult = scenario.bannerImage ? await this.assetRepository.findById(scenario.bannerImage) : null

    const personaPromises = scenario.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)

    const scenarioType = isIssuanceScenario(scenario) ? ScenarioType.ISSUANCE : ScenarioType.PRESENTATION

    const scenarioPartyResult: Issuer | RelyingParty = isIssuanceScenario(scenario)
      ? await this.issuerRepository.findById((<NewIssuanceScenario>scenario).issuer)
      : await this.relyingPartyRepository.findById((<NewPresentationScenario>scenario).relyingParty)

    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: scenario.name,
      connection,
      schema: scenarios,
    })

    return connection.transaction(async (tx): Promise<Scenario> => {
      const [scenarioResult] = await tx
        .insert(scenarios)
        .values({
          ...scenario,
          slug,
          ...(isIssuanceScenario(scenario) && {
            issuer: scenarioPartyResult.id,
          }),
          ...(isPresentationScenario(scenario) && {
            relyingParty: scenarioPartyResult.id,
          }),
          scenarioType: scenarioType,
        })
        .returning()

      const scenariosToPersonasResult = await tx
        .insert(scenariosToPersonas)
        .values(
          scenario.personas.map((personaId: string) => ({
            scenario: scenarioResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          credentialDefinitions.id,
          scenariosToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      const stepsResult = await tx
        .insert(steps)
        .values(
          scenario.steps.map((step: NewStep) => ({
            ...step,
            scenario: scenarioResult.id,
          })),
        )
        .returning()

      const stepActionsResult = await tx
        .insert(stepActions)
        .values(
          stepsResult.flatMap((stepResult, index) =>
            scenario.steps[index].actions.map((action) => ({
              ...action,
              step: stepResult.id,
            })),
          ),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          scenario.steps.flatMap((step, index) =>
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

      const scenarioSteps = stepsResult.map((stepResult) => ({
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
        id: scenarioResult.id,
        name: scenarioResult.name,
        slug: scenarioResult.slug,
        description: scenarioResult.description,
        steps: sortSteps(scenarioSteps),
        scenarioType: scenarioType,
        ...(isIssuanceScenario(scenario) && {
          issuer: <Issuer>scenarioPartyResult,
        }),
        ...(isPresentationScenario(scenario) && {
          relyingParty: <RelyingParty>scenarioPartyResult,
        }),
        personas: personasResult,
        createdAt: scenarioResult.createdAt,
        updatedAt: scenarioResult.updatedAt,
        hidden: scenarioResult.hidden,
        bannerImage: bannerImageResult,
      }
    })
  }

  async delete(scenarioId: string): Promise<void> {
    await this.findById(scenarioId)
    await (await this.databaseService.getConnection()).delete(scenarios).where(eq(scenarios.id, scenarioId))
  }

  async update(scenarioId: string, scenario: NewScenario): Promise<Scenario> {
    if (scenario.steps.length === 0) {
      return Promise.reject(new BadRequestError('At least one step is required'))
    }
    if (scenario.personas.length === 0) {
      return Promise.reject(new BadRequestError('At least one persona is required'))
    }

    const bannerImageResult = scenario.bannerImage ? await this.assetRepository.findById(scenario.bannerImage) : null

    const personaPromises = scenario.personas.map(async (persona) => await this.personaRepository.findById(persona))
    await Promise.all(personaPromises)

    const scenarioType = isIssuanceScenario(scenario) ? ScenarioType.ISSUANCE : ScenarioType.PRESENTATION

    const scenarioPartyResult: Issuer | RelyingParty = isIssuanceScenario(scenario)
      ? await this.issuerRepository.findById((<NewIssuanceScenario>scenario).issuer)
      : await this.relyingPartyRepository.findById((<NewPresentationScenario>scenario).relyingParty)

    const connection = await this.databaseService.getConnection()
    const slug = await generateSlug({
      value: scenario.name,
      id: scenarioId,
      connection,
      schema: scenarios,
    })

    return connection.transaction(async (tx): Promise<Scenario> => {
      const [scenarioResult] = await tx
        .update(scenarios)
        .set({
          ...scenario,
          slug,
          ...(isIssuanceScenario(scenario) && {
            issuer: scenarioPartyResult.id,
          }),
          ...(isPresentationScenario(scenario) && {
            relyingParty: scenarioPartyResult.id,
          }),
          scenarioType: scenarioType,
        })
        .where(eq(scenarios.id, scenarioId))
        .returning()

      await tx.delete(scenariosToPersonas).where(eq(scenariosToPersonas.scenario, scenarioId))

      const scenariosToPersonasResult = await tx
        .insert(scenariosToPersonas)
        .values(
          scenario.personas.map((personaId: string) => ({
            scenario: scenarioResult.id,
            persona: personaId,
          })),
        )
        .returning()

      const personasResult = await tx.query.personas.findMany({
        where: inArray(
          credentialDefinitions.id,
          scenariosToPersonasResult.map((item) => item.persona),
        ),
        with: {
          headshotImage: true,
          bodyImage: true,
        },
      })

      await tx.delete(steps).where(eq(steps.scenario, scenarioId))

      const stepsResult = await tx
        .insert(steps)
        .values(
          scenario.steps.map((step: NewStep) => ({
            ...step,
            scenario: scenarioResult.id,
          })),
        )
        .returning()

      const stepActionsResult = await tx
        .insert(stepActions)
        .values(
          stepsResult.flatMap((stepResult, index) =>
            scenario.steps[index].actions.map((action) => ({
              ...action,
              step: stepResult.id,
            })),
          ),
        )
        .returning()

      const proofRequestsResult = await tx
        .insert(ariesProofRequests)
        .values(
          scenario.steps.flatMap((step, index) =>
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

      const scenarioSteps = stepsResult.map((stepResult) => ({
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
        id: scenarioResult.id,
        name: scenarioResult.name,
        slug: scenarioResult.slug, // TODO
        description: scenarioResult.description,
        steps: sortSteps(scenarioSteps),
        scenarioType: scenarioType,
        ...(isIssuanceScenario(scenario) && {
          issuer: <Issuer>scenarioPartyResult,
        }),
        ...(isPresentationScenario(scenario) && {
          relyingParty: <RelyingParty>scenarioPartyResult,
        }),
        personas: personasResult,
        createdAt: scenarioResult.createdAt,
        updatedAt: scenarioResult.updatedAt,
        hidden: scenarioResult.hidden,
        bannerImage: bannerImageResult,
      }
    })
  }

  async findById(scenarioId: string): Promise<Scenario> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.scenarios.findFirst({
      where: and(eq(scenarios.id, scenarioId)),
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
            cds: {
              with: {
                cd: {
                  with: {
                    icon: true,
                    cs: {
                      with: {
                        attributes: true,
                      },
                    },
                    representations: true,
                    revocation: true,
                  },
                },
              },
            },
            logo: true,
          },
        },
        issuer: {
          with: {
            cds: {
              with: {
                cd: {
                  with: {
                    icon: true,
                    cs: {
                      with: {
                        attributes: true,
                      },
                    },
                    representations: true,
                    revocation: true,
                  },
                },
              },
            },
            css: {
              with: {
                cs: {
                  with: {
                    attributes: true,
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
        bannerImage: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No scenario found for id: ${scenarioId}`))
    }

    return {
      ...result,
      steps: sortSteps(result.steps),
      ...(result.issuer && {
        issuer: {
          ...(result.issuer as any), // TODO check this typing issue at a later point in time
          credentialDefinitions: result.issuer!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
          credentialSchemas: result.issuer!.css.map((credentialSchema: any) => credentialSchema.cs),
        },
      }),
      ...(result.relyingParty && {
        relyingParty: {
          ...(result.relyingParty as any), // TODO check this typing issue at a later point in time
          credentialDefinitions: result.relyingParty!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
        },
      }),
      personas: result.personas.map((item: any) => item.persona),
    }
  }

  async findAll(args: ScenarioFindAllArgs): Promise<Scenario[]> {
    const { filter } = args
    const result = await (
      await this.databaseService.getConnection()
    ).query.scenarios.findMany({
      where: eq(scenarios.scenarioType, filter.scenarioType),
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
            cds: {
              with: {
                cd: {
                  with: {
                    icon: true,
                    cs: {
                      with: {
                        attributes: true,
                      },
                    },
                    representations: true,
                    revocation: true,
                  },
                },
              },
            },
            logo: true,
          },
        },
        issuer: {
          with: {
            cds: {
              with: {
                cd: {
                  with: {
                    icon: true,
                    cs: {
                      with: {
                        attributes: true,
                      },
                    },
                    representations: true,
                    revocation: true,
                  },
                },
              },
            },
            css: {
              with: {
                cs: {
                  with: {
                    attributes: true,
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
        bannerImage: true,
      },
    })

    return result.map((scenario: any) => ({
      ...scenario,
      steps: sortSteps(scenario.steps),
      ...(scenario.issuer && {
        issuer: {
          ...(scenario.issuer as any), // TODO check this typing issue at a later point in time
          credentialDefinitions: scenario.issuer!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
          credentialSchemas: scenario.issuer!.css.map((credentialSchema: any) => credentialSchema.cs),
        },
      }),
      ...(scenario.relyingParty && {
        relyingParty: {
          ...(scenario.relyingParty as any), // TODO check this typing issue at a later point in time
          credentialDefinitions: scenario.relyingParty!.cds.map((credentialDefinition: any) => credentialDefinition.cd),
        },
      }),
      personas: scenario.personas.map((item: any) => item.persona), // TODO check this typing issue at a later point in time
    }))
  }

  async createStep(scenarioId: string, step: NewStep): Promise<Step> {
    await this.findById(scenarioId)

    if (step.actions.length === 0) {
      return Promise.reject(new BadRequestError('At least one action is required'))
    }

    const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
      const [stepResult] = await tx
        .insert(steps)
        .values({
          ...step,
          scenario: scenarioId,
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

  async deleteStep(scenarioId: string, stepId: string): Promise<void> {
    await this.findByStepId(scenarioId, stepId)
    await (await this.databaseService.getConnection()).delete(steps).where(and(eq(steps.id, stepId), eq(steps.scenario, scenarioId)))
  }

  async updateStep(scenarioId: string, stepId: string, step: NewStep): Promise<Step> {
    await this.findById(scenarioId)

    if (step.actions.length === 0) {
      return Promise.reject(new BadRequestError('At least one action is required'))
    }

    const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
      const [stepResult] = await tx
        .update(steps)
        .set({
          ...step,
          scenario: scenarioId,
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

  async findByStepId(scenarioId: string, stepId: string): Promise<Step> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.steps.findFirst({
      where: and(and(eq(steps.id, stepId), eq(steps.scenario, scenarioId))),
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
      return Promise.reject(new NotFoundError(`No step found for scenario id: ${scenarioId} and step id: ${stepId}`))
    }

    return result
  }

  async findAllSteps(scenarioId: string): Promise<Step[]> {
    await this.findById(scenarioId)
    const result = await (
      await this.databaseService.getConnection()
    ).query.steps.findMany({
      where: eq(steps.scenario, scenarioId),
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

  async createStepAction(scenarioId: string, stepId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
    await this.findByStepId(scenarioId, stepId)

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

  async deleteStepAction(scenarioId: string, stepId: string, actionId: string): Promise<void> {
    await this.findByStepActionId(scenarioId, stepId, actionId)
    await (await this.databaseService.getConnection()).delete(stepActions).where(and(eq(stepActions.id, actionId), eq(stepActions.step, stepId)))
  }

  async updateStepAction(scenarioId: string, stepId: string, actionId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
    await this.findByStepId(scenarioId, stepId)

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

  async findByStepActionId(scenarioId: string, stepId: string, actionId: string): Promise<AriesOOBAction> {
    await this.findByStepId(scenarioId, stepId)
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

  async findAllStepActions(scenarioId: string, stepId: string): Promise<AriesOOBAction[]> {
    await this.findByStepId(scenarioId, stepId)
    return (await this.databaseService.getConnection()).query.stepActions.findMany({
      where: and(eq(stepActions.step, stepId)),
      with: {
        proofRequest: true,
      },
    })
  }

  async findIdBySlug(slug: string): Promise<string> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.scenarios.findFirst({
      where: eq(scenarios.slug, slug),
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No scenario found for slug: ${slug}`))
    }

    return result.id
  }
}

export default ScenarioRepository
