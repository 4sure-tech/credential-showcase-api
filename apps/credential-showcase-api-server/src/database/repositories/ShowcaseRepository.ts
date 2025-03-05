import { inArray, eq } from 'drizzle-orm';
import { Service } from 'typedi';
import DatabaseService from '../../services/DatabaseService';
import CredentialDefinitionRepository from './CredentialDefinitionRepository';
import PersonaRepository from './PersonaRepository';
import ScenarioRepository from './ScenarioRepository';
import { sortSteps } from '../../utils/sortUtils';
import { NotFoundError } from '../../errors';
import {
    credentialDefinitions,
    showcasesToCredentialDefinitions,
    showcases,
    workflows,
    personas,
    showcasesToPersonas,
    showcasesToScenarios,
} from '../schema';
import { Showcase, NewShowcase, RepositoryDefinition } from '../../types';

@Service()
class ShowcaseRepository implements RepositoryDefinition<Showcase, NewShowcase> {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly personaRepository: PersonaRepository,
        private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
        private readonly scenarioRepository: ScenarioRepository
    ) {}

    async create(showcase: NewShowcase): Promise<Showcase> {
        if (showcase.personas.length === 0) {
            return Promise.reject(Error('At least one persona is required'));
        }
        if (showcase.credentialDefinitions.length === 0) {
            return Promise.reject(Error('At least one credential definition is required'));
        }
        if (showcase.scenarios.length === 0) {
            return Promise.reject(Error('At least one scenario is required'));
        }

        const personaPromises = showcase.personas.map(async persona => await this.personaRepository.findById(persona))
        await Promise.all(personaPromises)
        const credentialDefinitionPromises = showcase.credentialDefinitions.map(async credentialDefinition => await this.credentialDefinitionRepository.findById(credentialDefinition))
        await Promise.all(credentialDefinitionPromises)
        const scenarioPromises = showcase.scenarios.map(async scenario => this.scenarioRepository.findById(scenario))
        await Promise.all(scenarioPromises)

        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Showcase> => {
            const [showcaseResult] = await tx.insert(showcases)
                .values(showcase)
                .returning();

            const showcasesToScenariosResult = await tx.insert(showcasesToScenarios)
                .values(showcase.scenarios.map((scenarioId: string) => ({
                    showcase: showcaseResult.id,
                    scenario: scenarioId
                })))
                .returning();

            const scenariosResult = await tx.query.workflows.findMany({
                where: inArray(workflows.id, showcasesToScenariosResult.map(item => item.scenario)),
                with: {
                    steps: {
                        with: {
                            actions: {
                                with: {
                                    proofRequest: true
                                }
                            },
                            asset: true,
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

            const showcasesToCredentialDefinitionsResult = await tx.insert(showcasesToCredentialDefinitions)
                .values(showcase.credentialDefinitions.map((credentialDefinitionId: string) => ({
                    showcase: showcaseResult.id,
                    credentialDefinition: credentialDefinitionId
                })))
                .returning();

            const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
                where: inArray(credentialDefinitions.id, showcasesToCredentialDefinitionsResult.map(item => item.credentialDefinition)),
                with: {
                    attributes: true,
                    representations: true,
                    revocation: true,
                    icon: true
                },
            })

            const showcasesToPersonasResult = await tx.insert(showcasesToPersonas)
                .values(showcase.personas.map((personaId: string) => ({
                    showcase: showcaseResult.id,
                    persona: personaId
                })))
                .returning();

            const personasResult = await tx.query.personas.findMany({
                where: inArray(personas.id, showcasesToPersonasResult.map(item => item.persona)),
                with: {
                    headshotImage: true,
                    bodyImage: true,
                },
            })

            return {
                ...showcaseResult,
                scenarios: scenariosResult.map(scenario => ({
                    ...scenario,
                    steps: sortSteps(scenario.steps),
                    ...(scenario.relyingParty && {
                        relyingParty: {
                            ...scenario.relyingParty as any, // TODO check this typing issue at a later point in time
                            credentialDefinitions: scenario.relyingParty!.cds.map(credentialDefinition => credentialDefinition.cd)
                        },
                    }),
                    ...(scenario.issuer && {
                        issuer: {
                            ...scenario.issuer as any, // TODO check this typing issue at a later point in time
                            credentialDefinitions: scenario.issuer!.cds.map(credentialDefinition => credentialDefinition.cd)
                        },
                    }),
                    personas: scenario.personas.map(item => item.persona)
                })),
                credentialDefinitions: credentialDefinitionsResult,
                personas: personasResult
            }
        })
    }

    async delete(id: string): Promise<void> {
        await this.findById(id)
        await (await this.databaseService.getConnection())
            .delete(showcases)
            .where(eq(showcases.id, id))
    }

    async update(id: string, showcase: NewShowcase): Promise<Showcase> {
        await this.findById(id)
        if (showcase.personas.length === 0) {
            return Promise.reject(Error('At least one persona is required'));
        }
        if (showcase.credentialDefinitions.length === 0) {
            return Promise.reject(Error('At least one credential definition is required'));
        }
        if (showcase.scenarios.length === 0) {
            return Promise.reject(Error('At least one scenario is required'));
        }

        const personaPromises = showcase.personas.map(async persona => await this.personaRepository.findById(persona))
        await Promise.all(personaPromises)
        const credentialDefinitionPromises = showcase.credentialDefinitions.map(async credentialDefinition => await this.credentialDefinitionRepository.findById(credentialDefinition))
        await Promise.all(credentialDefinitionPromises)
        const scenarioPromises = showcase.scenarios.map(async scenario => this.scenarioRepository.findById(scenario))
        await Promise.all(scenarioPromises)

        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Showcase> => {
            const [showcaseResult] = await tx.update(showcases)
                .set(showcase)
                .where(eq(showcases.id, id))
                .returning();

            await tx.delete(showcasesToCredentialDefinitions).where(eq(showcasesToCredentialDefinitions.showcase, id))
            await tx.delete(showcasesToPersonas).where(eq(showcasesToPersonas.showcase, id))
            await tx.delete(showcasesToScenarios).where(eq(showcasesToScenarios.showcase, id))

            const showcasesToScenariosResult = await tx.insert(showcasesToScenarios)
                .values(showcase.scenarios.map((scenarioId: string) => ({
                    showcase: showcaseResult.id,
                    scenario: scenarioId
                })))
                .returning();

            const scenariosResult = await tx.query.workflows.findMany({
                where: inArray(workflows.id, showcasesToScenariosResult.map(item => item.scenario)),
                with: {
                    steps: {
                        with: {
                            actions: {
                                with: {
                                    proofRequest: true
                                }
                            },
                            asset: true,
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

            const showcasesToCredentialDefinitionsResult = await tx.insert(showcasesToCredentialDefinitions)
                .values(showcase.credentialDefinitions.map((credentialDefinitionId: string) => ({
                    showcase: showcaseResult.id,
                    credentialDefinition: credentialDefinitionId
                })))
                .returning();

            const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
                where: inArray(credentialDefinitions.id, showcasesToCredentialDefinitionsResult.map(item => item.credentialDefinition)),
                with: {
                    attributes: true,
                    representations: true,
                    revocation: true,
                    icon: true
                },
            })

            const showcasesToPersonasResult = await tx.insert(showcasesToPersonas)
                .values(showcase.personas.map((personaId: string) => ({
                    showcase: showcaseResult.id,
                    persona: personaId
                })))
                .returning();

            const personasResult = await tx.query.personas.findMany({
                where: inArray(personas.id, showcasesToPersonasResult.map(item => item.persona)),
                with: {
                    headshotImage: true,
                    bodyImage: true,
                },
            })

            return {
                ...showcaseResult,
                scenarios: scenariosResult.map(scenario => ({
                    ...scenario,
                    steps: sortSteps(scenario.steps),
                    ...(scenario.relyingParty && {
                        relyingParty: {
                            ...scenario.relyingParty as any, // TODO check this typing issue at a later point in time
                            credentialDefinitions: scenario.relyingParty!.cds.map(credentialDefinition => credentialDefinition.cd)
                        },
                    }),
                    ...(scenario.issuer && {
                        issuer: {
                            ...scenario.issuer as any, // TODO check this typing issue at a later point in time
                            credentialDefinitions: scenario.issuer!.cds.map(credentialDefinition => credentialDefinition.cd)
                        },
                    }),
                    personas: scenario.personas.map(item => item.persona)
                })),
                credentialDefinitions: credentialDefinitionsResult,
                personas: personasResult
            }
        })
    }

    async findById(id: string): Promise<Showcase> {
        const result = await (await this.databaseService.getConnection()).query.showcases.findFirst({
            where: eq(showcases.id, id),
            with: {
                credentialDefinitions: {
                    with: {
                        credentialDefinition: {
                            with: {
                                icon: true,
                                attributes: true,
                                representations: true,
                                revocation: true
                            }
                        }
                    }
                },
                scenarios: {
                    with: {
                        scenario: {
                            with: {
                                steps: {
                                    with: {
                                        actions: {
                                            with: {
                                                proofRequest: true
                                            }
                                        },
                                        asset: true,
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
                        }
                    },
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
            return Promise.reject(new NotFoundError(`No showcase found for id: ${id}`))
        }

        return {
            ...result,
            scenarios: result.scenarios.map(scenario => ({
                ...scenario.scenario as any,
                steps: sortSteps(scenario.scenario.steps),
                ...(scenario.scenario.relyingParty && {
                    relyingParty: {
                        ...scenario.scenario.relyingParty as any, // TODO check this typing issue at a later point in time
                        credentialDefinitions: scenario.scenario.relyingParty!.cds.map(credentialDefinition => credentialDefinition.cd)
                    },
                }),
                ...(scenario.scenario.issuer && {
                    issuer: {
                        ...scenario.scenario.issuer as any, // TODO check this typing issue at a later point in time
                        credentialDefinitions: scenario.scenario.issuer!.cds.map(credentialDefinition => credentialDefinition.cd)
                    },
                }),
                personas: scenario.scenario.personas.map(item => item.persona)
            })),
            credentialDefinitions: result.credentialDefinitions.map(item => item.credentialDefinition),
            personas: result.personas.map(item => item.persona),
        }
    }

    async findAll(): Promise<Showcase[]> {
        const result = await (await this.databaseService.getConnection()).query.showcases.findMany({
            with: {
                credentialDefinitions: {
                    with: {
                        credentialDefinition: {
                            with: {
                                icon: true,
                                attributes: true,
                                representations: true,
                                revocation: true
                            }
                        }
                    }
                },
                scenarios: {
                    with: {
                        scenario: {
                            with: {
                                steps: {
                                    with: {
                                        actions: {
                                            with: {
                                                proofRequest: true
                                            }
                                        },
                                        asset: true,
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
                        }
                    },
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

        return result.map((showcase: any) => ({
            ...showcase,
            scenarios: showcase.scenarios.map((scenario: any) => ({
                ...scenario.scenario,
                steps: sortSteps(scenario.scenario.steps),
                ...(scenario.scenario.relyingParty && {
                    relyingParty: {
                        ...scenario.scenario.relyingParty as any, // TODO check this typing issue at a later point in time
                        credentialDefinitions: scenario.scenario.relyingParty!.cds.map((credentialDefinition: any) => credentialDefinition.cd)
                    },
                }),
                ...(scenario.scenario.issuer && {
                    issuer: {
                        ...scenario.scenario.issuer as any, // TODO check this typing issue at a later point in time
                        credentialDefinitions: scenario.scenario.issuer!.cds.map((credentialDefinition: any) => credentialDefinition.cd)
                    },
                }),
                personas: scenario.scenario.personas.map((item: any) => item.persona) // TODO check this typing issue at a later point in time
            })),
            credentialDefinitions: showcase.credentialDefinitions.map((item: any) => item.credentialDefinition), // TODO check this typing issue at a later point in time
            personas: showcase.personas.map((item: any) => item.persona), // TODO check this typing issue at a later point in time
        }))
    }
}

export default ShowcaseRepository
