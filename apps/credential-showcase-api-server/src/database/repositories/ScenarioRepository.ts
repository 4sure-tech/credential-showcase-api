import { and, eq, inArray } from 'drizzle-orm';
import { Service } from 'typedi';
import DatabaseService from '../../services/DatabaseService';
import PersonaRepository from './PersonaRepository';
import IssuerRepository from './IssuerRepository';
import RelyingPartyRepository from './RelyingPartyRepository';
import AssetRepository from './AssetRepository';
import { isIssuanceScenario, isPresentationScenario } from '../../utils/mappers';
import { sortSteps } from '../../utils/sortUtils';
import { NotFoundError } from '../../errors';
import {
    ariesProofRequests,
    assets,
    credentialDefinitions,
    stepActions,
    steps,
    workflows,
    workflowsToPersonas
} from '../schema';
import {
    AriesOOBAction,
    Issuer,
    NewAriesOOBAction,
    NewIssuanceFlow,
    NewPresentationFlow,
    NewScenario,
    NewStep,
    RelyingParty,
    RepositoryDefinition,
    Scenario,
    ScenarioFindAllArgs,
    Step,
    WorkflowType
} from '../../types';

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
            return Promise.reject(Error('At least one step is required'));
        }
        if (scenario.personas.length === 0) {
            return Promise.reject(Error('At least one persona is required'));
        }

        const personaPromises = scenario.personas.map(async persona => await this.personaRepository.findById(persona))
        await Promise.all(personaPromises)

        const scenarioType = isIssuanceScenario(scenario)
            ? WorkflowType.ISSUANCE
            : WorkflowType.PRESENTATION

        const scenarioPartyResult: Issuer | RelyingParty = isIssuanceScenario(scenario)
            ? await this.issuerRepository.findById((<NewIssuanceFlow>scenario).issuer)
            : await this.relyingPartyRepository.findById((<NewPresentationFlow>scenario).relyingParty)

        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Scenario> => {
            const [scenarioResult] = await tx.insert(workflows)
                .values({
                    name: scenario.name,
                    description: scenario.description,
                    ...(isIssuanceScenario(scenario) && {
                        issuer: scenarioPartyResult.id,
                    }),
                    ...(isPresentationScenario(scenario) && {
                        relyingParty: scenarioPartyResult.id,
                    }),
                    workflowType: scenarioType,
                })
                .returning();

            const workflowsToPersonasResult = await tx.insert(workflowsToPersonas)
                .values(scenario.personas.map((personaId: string) => ({
                    workflow: scenarioResult.id,
                    persona: personaId
                })))
                .returning();

            const personasResult = await tx.query.personas.findMany({
                where: inArray(credentialDefinitions.id, workflowsToPersonasResult.map(item => item.persona)),
                with: {
                    headshotImage: true,
                    bodyImage: true
                },
            })

            const stepsResult = await tx.insert(steps)
                .values(scenario.steps.map((step: NewStep) => ({
                    ...step,
                    workflow: scenarioResult.id
                })))
                .returning();

            const stepActionsResult = await tx.insert(stepActions)
                .values(stepsResult.flatMap((stepResult, index) =>
                    scenario.steps[index].actions.map(action => ({
                        ...action,
                        step: stepResult.id,
                    }))
                ))
                .returning();

            const proofRequestsResult = await tx.insert(ariesProofRequests)
                .values(scenario.steps.flatMap((step, index) =>
                    step.actions.map((action, actionIndex) => {
                        const stepAction = stepActionsResult[index * step.actions.length + actionIndex]
                        return {
                            ...action.proofRequest,
                            stepAction: stepAction.id,
                        }
                    })
                ))
                .returning();

            const stepAssetsResult = await tx.query.assets.findMany({
                where: inArray(assets.id, stepsResult.map(step => step.asset).filter(assetId => assetId !== null))
            })

            const flowSteps = stepsResult.map(stepResult => ({
                ...stepResult,
                actions: stepActionsResult.filter(stepActionResult => stepActionResult.step === stepResult.id)
                    .map(action => ({
                        ...action,
                        proofRequest: proofRequestsResult.find(proofRequest => proofRequest.stepAction === action.id)
                    })),
                asset: stepAssetsResult.find(asset => asset.id === stepResult.asset)
            }))

            return {
                id: scenarioResult.id,
                name: scenarioResult.name,
                description: scenarioResult.description,
                steps: sortSteps(flowSteps),
                workflowType: scenarioType,
                ...(isIssuanceScenario(scenario) && {
                    issuer: <Issuer>scenarioPartyResult,
                }),
                ...(isPresentationScenario(scenario) && {
                    relyingParty: <RelyingParty>scenarioPartyResult,
                }),
                personas: personasResult
            }
        })
    }

    async delete(scenarioId: string): Promise<void> {
        await this.findById(scenarioId)
        await (await this.databaseService.getConnection())
            .delete(workflows)
            .where(eq(workflows.id, scenarioId))
    }

    async update(scenarioId: string, scenario: NewScenario): Promise<Scenario> {
        if (scenario.steps.length === 0) {
            return Promise.reject(Error('At least one step is required'));
        }
        if (scenario.personas.length === 0) {
            return Promise.reject(Error('At least one persona is required'));
        }

        const personaPromises = scenario.personas.map(async persona => await this.personaRepository.findById(persona))
        await Promise.all(personaPromises)

        const scenarioType = isIssuanceScenario(scenario)
            ? WorkflowType.ISSUANCE
            : WorkflowType.PRESENTATION

        const scenarioPartyResult: Issuer | RelyingParty = isIssuanceScenario(scenario)
            ? await this.issuerRepository.findById((<NewIssuanceFlow>scenario).issuer)
            : await this.relyingPartyRepository.findById((<NewPresentationFlow>scenario).relyingParty)

        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Scenario> => {
            const [scenarioResult] = await tx.update(workflows)
                .set({
                    name: scenario.name,
                    description: scenario.description,
                    ...(isIssuanceScenario(scenario) && {
                        issuer: scenarioPartyResult.id,
                    }),
                    ...(isPresentationScenario(scenario) && {
                        relyingParty: scenarioPartyResult.id,
                    }),
                    workflowType: scenarioType,
                })
                .where(eq(workflows.id, scenarioId))
                .returning();

            await tx.delete(workflowsToPersonas).where(eq(workflowsToPersonas.workflow, scenarioId))

            const workflowsToPersonasResult = await tx.insert(workflowsToPersonas)
                .values(scenario.personas.map((personaId: string) => ({
                    workflow: scenarioResult.id,
                    persona: personaId
                })))
                .returning();

            const personasResult = await tx.query.personas.findMany({
                where: inArray(credentialDefinitions.id, workflowsToPersonasResult.map(item => item.persona)),
                with: {
                    headshotImage: true,
                    bodyImage: true
                },
            })

            await tx.delete(steps).where(eq(steps.workflow, scenarioId))

            const stepsResult = await tx.insert(steps)
                .values(scenario.steps.map((step: NewStep) => ({
                    ...step,
                    workflow: scenarioResult.id
                })))
                .returning();

            const stepActionsResult = await tx.insert(stepActions)
                .values(stepsResult.flatMap((stepResult, index) =>
                    scenario.steps[index].actions.map(action => ({
                        ...action,
                        step: stepResult.id,
                    }))
                ))
                .returning();

            const proofRequestsResult = await tx.insert(ariesProofRequests)
                .values(scenario.steps.flatMap((step, index) =>
                    step.actions.map((action, actionIndex) => {
                        const stepAction = stepActionsResult[index * step.actions.length + actionIndex]
                        return {
                            ...action.proofRequest,
                            stepAction: stepAction.id,
                        }
                    })
                ))
                .returning();

            const stepAssetsResult = await tx.query.assets.findMany({
                where: inArray(assets.id, stepsResult.map(step => step.asset).filter(assetId => assetId !== null))
            })

            const flowSteps = stepsResult.map(stepResult => ({
                ...stepResult,
                actions: stepActionsResult.filter(stepActionResult => stepActionResult.step === stepResult.id)
                    .map(action => ({
                        ...action,
                        proofRequest: proofRequestsResult.find(proofRequest => proofRequest.stepAction === action.id)
                    })),
                asset: stepAssetsResult.find(asset => asset.id === stepResult.asset)
            }))

            return {
                id: scenarioResult.id,
                name: scenarioResult.name,
                description: scenarioResult.description,
                steps: sortSteps(flowSteps),
                workflowType: scenarioType,
                ...(isIssuanceScenario(scenario) && {
                    issuer: <Issuer>scenarioPartyResult,
                }),
                ...(isPresentationScenario(scenario) && {
                    relyingParty: <RelyingParty>scenarioPartyResult,
                }),
                personas: personasResult
            }
        })
    }

    async findById(scenarioId: string): Promise<Scenario> {
        const result = await (await this.databaseService.getConnection()).query.workflows.findFirst({
            where: and(eq(workflows.id, scenarioId)),
            with: {
                steps: {
                    with: {
                        actions: {
                            with: {
                                proofRequest: true
                            }
                        },
                        asset: true
                    }
                },
                relyingParty: {
                    with: {
                        cds: {
                            with: {
                                cd: {
                                    with: {
                                        icon: true,
                                        attributes: true,
                                        representations: true,
                                        revocation: true
                                    }
                                }
                            }
                        },
                        logo: true
                    }
                },
                issuer: {
                    with: {
                        cds: {
                            with: {
                                cd: {
                                    with: {
                                        icon: true,
                                        attributes: true,
                                        representations: true,
                                        revocation: true
                                    }
                                }
                            }
                        },
                        logo: true
                    }
                },
                personas: {
                    with: {
                        persona: {
                            with: {
                                headshotImage: true,
                                bodyImage: true
                            }
                        }
                    }
                }
            }
        })

        if (!result) {
            return Promise.reject(new NotFoundError(`No scenario found for id: ${scenarioId}`))
        }

        return {
            ...result,
            steps: sortSteps(result.steps),
            ...(result.issuer && {
                issuer: {
                    ...result.issuer as any, // TODO check this typing issue at a later point in time
                    credentialDefinitions: result.issuer!.cds.map(credentialDefinition => credentialDefinition.cd)
                },
            }),
            ...(result.relyingParty && {
                relyingParty: {
                    ...(result.relyingParty) as any, // TODO check this typing issue at a later point in time
                    credentialDefinitions: result.relyingParty!.cds.map(credentialDefinition => credentialDefinition.cd)
                },
            }),
            personas: result.personas.map(item => item.persona)
        };
    }

    async findAll(args: ScenarioFindAllArgs): Promise<Scenario[]> {
        const { filter } = args
        const result = await (await this.databaseService.getConnection()).query.workflows.findMany({
            where: eq(workflows.workflowType, filter.scenarioType),
            with: {
                steps: {
                    with: {
                        actions: {
                            with: {
                                proofRequest: true
                            }
                        },
                        asset: true
                    }
                },
                relyingParty: {
                    with: {
                        cds: {
                            with: {
                                cd: {
                                    with: {
                                        icon: true,
                                        attributes: true,
                                        representations: true,
                                        revocation: true
                                    }
                                }
                            }
                        },
                        logo: true
                    }
                },
                issuer: {
                    with: {
                        cds: {
                            with: {
                                cd: {
                                    with: {
                                        icon: true,
                                        attributes: true,
                                        representations: true,
                                        revocation: true
                                    }
                                }
                            }
                        },
                        logo: true
                    }
                },
                personas: {
                    with: {
                        persona: {
                            with: {
                                headshotImage: true,
                                bodyImage: true
                            }
                        }
                    }
                }
            }
        });

        return result.map((scenario: any) => ({
            ...scenario,
            steps: sortSteps(scenario.steps),
            ...(scenario.issuer && {
                issuer: {
                    ...scenario.issuer as any, // TODO check this typing issue at a later point in time
                    credentialDefinitions: scenario.issuer!.cds.map((credentialDefinition: any) => credentialDefinition.cd)
                },
            }),
            ...(scenario.relyingParty && {
                relyingParty: {
                    ...(scenario.relyingParty) as any, // TODO check this typing issue at a later point in time
                    credentialDefinitions: scenario.relyingParty!.cds.map((credentialDefinition: any) => credentialDefinition.cd)
                },
            }),
            personas: scenario.personas.map((item: any) => item.persona) // TODO check this typing issue at a later point in time
        }));
    }

    async createStep(scenarioId: string, step: NewStep): Promise<Step> {
        await this.findById(scenarioId)

        if (step.actions.length === 0) {
            return Promise.reject(Error('At least one action is required'));
        }

        const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
            const [stepResult] = await tx.insert(steps)
                .values({
                    ...step,
                    workflow: scenarioId
                })
                .returning();

            const actionsResult = await tx.insert(stepActions)
                .values(step.actions.map((action: NewAriesOOBAction) => ({
                    ...action,
                    step: stepResult.id
                })))
                .returning();

            const proofRequestsResult = await tx.insert(ariesProofRequests)
                .values(step.actions.map((action, index) => {
                    const stepAction = actionsResult[index]
                    return {
                        ...action.proofRequest,
                        stepAction: stepAction.id,
                    }
                }))
                .returning();

            return {
                ...stepResult,
                actions: actionsResult.map(action => ({
                    ...action,
                    proofRequest: proofRequestsResult.find(proofRequest => proofRequest.stepAction === action.id)
                })),
                asset: assetResult
            }
        })
    }

    async deleteStep(scenarioId: string, stepId: string): Promise<void> {
        await this.findByStepId(scenarioId, stepId)
        await (await this.databaseService.getConnection())
            .delete(steps)
            .where(and(eq(steps.id, stepId), eq(steps.workflow, scenarioId)));
    }

    async updateStep(scenarioId: string, stepId: string, step: NewStep): Promise<Step> {
        await this.findById(scenarioId)

        if (step.actions.length === 0) {
            return Promise.reject(Error('At least one action is required'));
        }

        const assetResult = step.asset ? await this.assetRepository.findById(step.asset) : null
        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Step> => {
            const [stepResult] = await tx.update(steps)
                .set({
                    ...step,
                    workflow: scenarioId
                })
                .where(eq(steps.id, stepId))
                .returning();

            await tx.delete(stepActions).where(eq(stepActions.step, stepId))

            const actionsResult = await tx.insert(stepActions)
                .values(step.actions.map((action: NewAriesOOBAction) => ({
                    ...action,
                    step: stepResult.id
                })))
                .returning();

            const proofRequestsResult = await tx.insert(ariesProofRequests)
                .values(step.actions.map((action, index) => {
                    const stepAction = actionsResult[index]
                    return {
                        ...action.proofRequest,
                        stepAction: stepAction.id,
                    }
                }))
                .returning();

            return {
                ...stepResult,
                actions: actionsResult.map(action => ({
                    ...action,
                    proofRequest: proofRequestsResult.find(proofRequest => proofRequest.stepAction === action.id)
                })),
                asset: assetResult
            }
        })
    }

    async findByStepId(scenarioId: string, stepId: string): Promise<Step> {
        const result = await (await this.databaseService.getConnection()).query.steps.findFirst({
            where: and(and(eq(steps.id, stepId), eq(steps.workflow, scenarioId))),
            with: {
                actions: {
                    with: {
                        proofRequest: true
                    }
                },
                asset: true
            }
        })

        if (!result) {
            return Promise.reject(new NotFoundError(`No step found for scenario id: ${scenarioId} and step id: ${stepId}`))
        }

        return result
    }

    async findAllSteps(scenarioId: string): Promise<Step[]> {
        const result = await (await this.databaseService.getConnection()).query.steps.findMany({
            where: eq(steps.workflow, scenarioId),
            with: {
                asset: true,
                actions: {
                    with: {
                        proofRequest: true
                    }
                },
            },
        });

        return sortSteps(result)
    }

    async createStepAction(scenarioId: string, stepId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
        await this.findByStepId(scenarioId, stepId)

        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<AriesOOBAction> => {
            const [actionResult] = await tx.insert(stepActions)
                .values({
                    ...action,
                    step: stepId
                })
                .returning();

            const [proofRequestsResult] = await tx.insert(ariesProofRequests)
                .values({
                    ...action.proofRequest,
                    stepAction: actionResult.id
                })
                .returning();

            return {
                ...actionResult,
                proofRequest: proofRequestsResult
            }
        })
    }

    async deleteStepAction(scenarioId: string, stepId: string, actionId: string): Promise<void> {
        await this.findByStepActionId(scenarioId, stepId, actionId)
        await (await this.databaseService.getConnection())
            .delete(stepActions)
            .where(and(eq(stepActions.id, actionId), eq(stepActions.step, stepId)));
    }

    async updateStepAction(scenarioId: string, stepId: string, actionId: string, action: NewAriesOOBAction): Promise<AriesOOBAction> {
        await this.findByStepId(scenarioId, stepId)

        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<AriesOOBAction> => {
            const [actionResult] = await tx.update(stepActions)
                .set({
                    ...action,
                    step: stepId
                })
                .where(eq(stepActions.id, actionId))
                .returning();

            await tx.delete(ariesProofRequests).where(eq(ariesProofRequests.stepAction, actionId))

            const [proofRequestsResult] = await tx.insert(ariesProofRequests)
                .values({
                    ...action.proofRequest,
                    stepAction: actionResult.id
                })
                .returning();

            return {
                ...actionResult,
                proofRequest: proofRequestsResult
            }
        })
    }

    async findByStepActionId(scenarioId: string, stepId: string, actionId: string): Promise<AriesOOBAction> {
        await this.findByStepId(scenarioId, stepId)
        const result = await (await this.databaseService.getConnection()).query.stepActions.findFirst({
            where: and(eq(stepActions.id, actionId)),
            with: {
                proofRequest: true
            }
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
                proofRequest: true
            }
        })
    }
}

export default ScenarioRepository
