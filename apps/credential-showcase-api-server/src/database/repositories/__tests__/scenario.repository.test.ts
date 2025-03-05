import 'reflect-metadata';
import {PGlite} from '@electric-sql/pglite';
import {drizzle} from 'drizzle-orm/pglite';
import {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {migrate} from 'drizzle-orm/node-postgres/migrator';
import {Container} from 'typedi';
import DatabaseService from '../../../services/DatabaseService';
import ScenarioRepository from '../../../database/repositories/ScenarioRepository';
import IssuerRepository from '../../../database/repositories/IssuerRepository';
import CredentialDefinitionRepository from '../../../database/repositories/CredentialDefinitionRepository';
import AssetRepository from '../../../database/repositories/AssetRepository';
import PersonaRepository from '../PersonaRepository';
import * as schema from '../../../database/schema';
import {
    Asset,
    CredentialAttributeType,
    CredentialType,
    IssuanceFlow,
    Issuer,
    IssuerType,
    NewAriesOOBAction,
    NewAsset,
    NewCredentialDefinition,
    NewIssuanceFlow,
    NewIssuer,
    NewPersona, NewPresentationFlow, NewRelyingParty,
    NewStep,
    Persona, PresentationFlow, RelyingParty, RelyingPartyType,
    StepActionType,
    StepType,
    WorkflowType
} from '../../../types';
import RelyingPartyRepository from '../RelyingPartyRepository';

describe('Database scenario repository tests', (): void => {
    let client: PGlite;
    let repository: ScenarioRepository;
    let issuer: Issuer
    let relyingParty: RelyingParty
    let asset: Asset
    let persona1: Persona
    let persona2: Persona

    beforeEach(async (): Promise<void> => {
        client = new PGlite();
        const database = drizzle(client, { schema }) as unknown as NodePgDatabase;
        await migrate(database, { migrationsFolder: './apps/credential-showcase-api-server/src/database/migrations' })
        const mockDatabaseService = {
            getConnection: jest.fn().mockResolvedValue(database),
        };
        Container.set(DatabaseService, mockDatabaseService);
        repository = Container.get(ScenarioRepository);
        const issuerRepository = Container.get(IssuerRepository);
        const relyingPartyRepository = Container.get(RelyingPartyRepository);
        const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository);
        const assetRepository = Container.get(AssetRepository);
        const newAsset: NewAsset = {
            mediaType: 'image/png',
            fileName: 'image.png',
            description: 'some image',
            content: Buffer.from('some binary data')
        };
        asset = await assetRepository.create(newAsset);
        const newCredentialDefinition: NewCredentialDefinition = {
            name: 'example_name',
            version: 'example_version',
            icon: asset.id,
            type: CredentialType.ANONCRED,
            attributes: [
                {
                    name: 'example_attribute_name1',
                    value: 'example_attribute_value1',
                    type: CredentialAttributeType.STRING
                },
                {
                    name: 'example_attribute_name2',
                    value: 'example_attribute_value2',
                    type: CredentialAttributeType.STRING
                }
            ],
            representations: [
                { // TODO SHOWCASE-81 OCARepresentation

                },
                { // TODO SHOWCASE-81 OCARepresentation

                }
            ],
            revocation: { // TODO SHOWCASE-80 AnonCredRevocation
                title: 'example_revocation_title',
                description: 'example_revocation_description'
            }
        };
        const credentialDefinition = await credentialDefinitionRepository.create(newCredentialDefinition);
        const newIssuer: NewIssuer = {
            name: 'example_name',
            type: IssuerType.ARIES,
            credentialDefinitions: [credentialDefinition.id],
            description: 'example_description',
            organization: 'example_organization',
            logo: asset.id,
        };
        issuer = await issuerRepository.create(newIssuer);
        const newRelyingParty: NewRelyingParty = {
            name: 'example_name',
            type: RelyingPartyType.ARIES,
            credentialDefinitions: [credentialDefinition.id],
            description: 'example_description',
            organization: 'example_organization',
            logo: asset.id,
        };
        relyingParty = await relyingPartyRepository.create(newRelyingParty)
        const personaRepository = Container.get(PersonaRepository);
        const newPersona: NewPersona = {
            name: 'John Doe',
            role: 'Software Engineer',
            description: 'Experienced developer',
            headshotImage: asset.id,
            bodyImage: asset.id
        };
        persona1 = await personaRepository.create(newPersona);
        persona2 = await personaRepository.create(newPersona);
    })

    afterEach(async (): Promise<void> => {
        await client.close();
        jest.resetAllMocks();
        Container.reset();
    });

    it('Should save issuance scenario to database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id, persona2.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)

        expect(savedIssuanceFlow).toBeDefined()
        expect(savedIssuanceFlow.name).toEqual(issuanceFlow.name)
        expect(savedIssuanceFlow.description).toEqual(issuanceFlow.description)
        expect(savedIssuanceFlow.steps).toBeDefined();
        expect(savedIssuanceFlow.steps.length).toEqual(2)
        expect(savedIssuanceFlow.steps[0].title).toEqual(issuanceFlow.steps[0].title)
        expect(savedIssuanceFlow.steps[0].order).toEqual(issuanceFlow.steps[0].order)
        expect(savedIssuanceFlow.steps[0].type).toEqual(issuanceFlow.steps[0].type)
        expect(savedIssuanceFlow.steps[0].actions.length).toEqual(1)
        expect(savedIssuanceFlow.steps[0].actions[0].id).toBeDefined()
        expect(savedIssuanceFlow.steps[0].actions[0].title).toEqual(issuanceFlow.steps[0].actions[0].title)
        expect(savedIssuanceFlow.steps[0].actions[0].actionType).toEqual(issuanceFlow.steps[0].actions[0].actionType)
        expect(savedIssuanceFlow.steps[0].actions[0].text).toEqual(issuanceFlow.steps[0].actions[0].text)
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest).not.toBeNull()
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.attributes).not.toBeNull()
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.predicates).not.toBeNull()
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(savedIssuanceFlow.steps[0].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
        expect(savedIssuanceFlow.steps[0].asset).not.toBeNull()
        expect(savedIssuanceFlow.steps[0].asset!.mediaType).toEqual(asset.mediaType)
        expect(savedIssuanceFlow.steps[0].asset!.fileName).toEqual(asset.fileName)
        expect(savedIssuanceFlow.steps[0].asset!.description).toEqual(asset.description)
        expect(savedIssuanceFlow.steps[0].asset!.content).toStrictEqual(asset.content)
        expect((<IssuanceFlow>savedIssuanceFlow).issuer).not.toBeNull()
        expect((<IssuanceFlow>savedIssuanceFlow).issuer!.name).toEqual(issuer.name);
        expect((<IssuanceFlow>savedIssuanceFlow).issuer!.credentialDefinitions.length).toEqual(1);
        expect((<IssuanceFlow>savedIssuanceFlow).issuer!.description).toEqual(issuer.description);
        expect((<IssuanceFlow>savedIssuanceFlow).issuer!.organization).toEqual(issuer.organization);
        expect((<IssuanceFlow>savedIssuanceFlow).issuer!.logo).not.toBeNull()
        expect(savedIssuanceFlow.personas).toBeDefined();
        expect(savedIssuanceFlow.personas.length).toEqual(2)
        expect(savedIssuanceFlow.personas[0].name).toEqual(persona1.name)
        expect(savedIssuanceFlow.personas[0].role).toEqual(persona1.role)
        expect(savedIssuanceFlow.personas[0].description).toEqual(persona1.description)
        expect(savedIssuanceFlow.personas[0].headshotImage).not.toBeNull()
        expect(savedIssuanceFlow.personas[0].headshotImage!.id).toBeDefined();
        expect(savedIssuanceFlow.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
        expect(savedIssuanceFlow.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
        expect(savedIssuanceFlow.personas[0].headshotImage!.description).toEqual(asset.description)
        expect(savedIssuanceFlow.personas[0].headshotImage!.content).toStrictEqual(asset.content)
        expect(savedIssuanceFlow.personas[0].bodyImage).not.toBeNull()
        expect(savedIssuanceFlow.personas[0].bodyImage!.id).toBeDefined();
        expect(savedIssuanceFlow.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
        expect(savedIssuanceFlow.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
        expect(savedIssuanceFlow.personas[0].bodyImage!.description).toEqual(asset.description)
        expect(savedIssuanceFlow.personas[0].bodyImage!.content).toStrictEqual(asset.content)
    })

    it('Should save presentation scenario to database', async (): Promise<void> => {
        const presentationFlow: NewPresentationFlow = {
            name: 'example_name',
            description: 'example_description',
            relyingParty: relyingParty.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id, persona2.id]
        };

        const savedPresentationFlow = await repository.create(presentationFlow)

        expect(savedPresentationFlow).toBeDefined()
        expect(savedPresentationFlow.name).toEqual(presentationFlow.name)
        expect(savedPresentationFlow.description).toEqual(presentationFlow.description)
        expect(savedPresentationFlow.steps).toBeDefined();
        expect(savedPresentationFlow.steps.length).toEqual(2)
        expect(savedPresentationFlow.steps[0].title).toEqual(presentationFlow.steps[0].title)
        expect(savedPresentationFlow.steps[0].order).toEqual(presentationFlow.steps[0].order)
        expect(savedPresentationFlow.steps[0].type).toEqual(presentationFlow.steps[0].type)
        expect(savedPresentationFlow.steps[0].actions.length).toEqual(1)
        expect(savedPresentationFlow.steps[0].actions[0].id).toBeDefined()
        expect(savedPresentationFlow.steps[0].actions[0].title).toEqual(presentationFlow.steps[0].actions[0].title)
        expect(savedPresentationFlow.steps[0].actions[0].actionType).toEqual(presentationFlow.steps[0].actions[0].actionType)
        expect(savedPresentationFlow.steps[0].actions[0].text).toEqual(presentationFlow.steps[0].actions[0].text)
        expect(savedPresentationFlow.steps[0].asset).not.toBeNull()
        expect(savedPresentationFlow.steps[0].asset!.mediaType).toEqual(asset.mediaType)
        expect(savedPresentationFlow.steps[0].asset!.fileName).toEqual(asset.fileName)
        expect(savedPresentationFlow.steps[0].asset!.description).toEqual(asset.description)
        expect(savedPresentationFlow.steps[0].asset!.content).toStrictEqual(asset.content)
        expect((<PresentationFlow>savedPresentationFlow).relyingParty).not.toBeNull()
        expect((<PresentationFlow>savedPresentationFlow).relyingParty!.name).toEqual(relyingParty.name);
        expect((<PresentationFlow>savedPresentationFlow).relyingParty!.credentialDefinitions.length).toEqual(1);
        expect((<PresentationFlow>savedPresentationFlow).relyingParty!.description).toEqual(relyingParty.description);
        expect((<PresentationFlow>savedPresentationFlow).relyingParty!.organization).toEqual(relyingParty.organization);
        expect((<PresentationFlow>savedPresentationFlow).relyingParty!.logo).not.toBeNull()
        expect(savedPresentationFlow.personas).toBeDefined();
        expect(savedPresentationFlow.personas.length).toEqual(2)
        expect(savedPresentationFlow.personas[0].name).toEqual(persona1.name)
        expect(savedPresentationFlow.personas[0].role).toEqual(persona1.role)
        expect(savedPresentationFlow.personas[0].description).toEqual(persona1.description)
        expect(savedPresentationFlow.personas[0].headshotImage).not.toBeNull()
        expect(savedPresentationFlow.personas[0].headshotImage!.id).toBeDefined();
        expect(savedPresentationFlow.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
        expect(savedPresentationFlow.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
        expect(savedPresentationFlow.personas[0].headshotImage!.description).toEqual(asset.description)
        expect(savedPresentationFlow.personas[0].headshotImage!.content).toStrictEqual(asset.content)
        expect(savedPresentationFlow.personas[0].bodyImage).not.toBeNull()
        expect(savedPresentationFlow.personas[0].bodyImage!.id).toBeDefined();
        expect(savedPresentationFlow.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
        expect(savedPresentationFlow.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
        expect(savedPresentationFlow.personas[0].bodyImage!.description).toEqual(asset.description)
        expect(savedPresentationFlow.personas[0].bodyImage!.content).toStrictEqual(asset.content)
    })

    it('Should throw error when saving scenario with no steps', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [],
            personas: [persona1.id]
        };

        await expect(repository.create(issuanceFlow)).rejects.toThrowError(`At least one step is required`)
    })

    it('Should throw error when saving scenario with invalid issuer id', async (): Promise<void> => {
        const unknownIssuerId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: unknownIssuerId,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        await expect(repository.create(issuanceFlow)).rejects.toThrowError(`No issuer found for id: ${unknownIssuerId}`)
    })

    it('Should throw error when saving scenario with duplicate step order', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        await expect(repository.create(issuanceFlow)).rejects.toThrowError('duplicate key value violates unique constraint "step_order_workflow_unique"') // FIXME would be nice if we can set a custom error message returns by a constraint
    })

    it('Should throw error when saving scenario with invalid persona id', async (): Promise<void> => {
        const unknownPersonaId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [unknownPersonaId]
        };

        await expect(repository.create(issuanceFlow)).rejects.toThrowError(`No persona found for id: ${unknownPersonaId}`)
    })

    it('Should throw error when saving scenario with no personas', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: []
        };

        await expect(repository.create(issuanceFlow)).rejects.toThrowError(`At least one persona is required`)
    })

    it('Should get scenario by id from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id, persona2.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const fromDb = await repository.findById(savedIssuanceFlow.id)

        expect(fromDb).toBeDefined()
        expect(fromDb.name).toEqual(issuanceFlow.name)
        expect(fromDb.description).toEqual(issuanceFlow.description)
        expect(fromDb.steps).toBeDefined()
        expect(fromDb.steps.length).toEqual(2)
        expect(fromDb.steps[0].actions[0].proofRequest).not.toBeNull()
        expect(fromDb.steps[0].actions[0].proofRequest!.attributes).not.toBeNull()
        expect(fromDb.steps[0].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
        expect(fromDb.steps[0].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(fromDb.steps[0].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(fromDb.steps[0].actions[0].proofRequest!.predicates).not.toBeNull()
        expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
        expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
        expect(fromDb.personas).toBeDefined();
        expect(fromDb.personas.length).toEqual(2)
        expect(fromDb.personas[0].name).toEqual(persona1.name)
        expect(fromDb.personas[0].role).toEqual(persona1.role)
        expect(fromDb.personas[0].description).toEqual(persona1.description)
        expect(fromDb.personas[0].headshotImage).not.toBeNull()
        expect(fromDb.personas[0].headshotImage!.id).toBeDefined();
        expect(fromDb.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
        expect(fromDb.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
        expect(fromDb.personas[0].headshotImage!.description).toEqual(asset.description)
        expect(fromDb.personas[0].headshotImage!.content).toStrictEqual(asset.content)
        expect(fromDb.personas[0].bodyImage).not.toBeNull()
        expect(fromDb.personas[0].bodyImage!.id).toBeDefined();
        expect(fromDb.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
        expect(fromDb.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
        expect(fromDb.personas[0].bodyImage!.description).toEqual(asset.description)
        expect(fromDb.personas[0].bodyImage!.content).toStrictEqual(asset.content)
    })

    it('Should get all scenarios from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id, persona2.id]
        };

        const savedIssuanceFlow1 = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow1).toBeDefined()

        const savedIssuanceFlow2 = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow2).toBeDefined()

        const fromDb = await repository.findAll({ filter: { scenarioType: WorkflowType.ISSUANCE } })

        expect(fromDb.length).toEqual(2)
    })

    it('Should delete scenario from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        await repository.delete(savedIssuanceFlow.id)

        await expect(repository.findById(savedIssuanceFlow.id)).rejects.toThrowError(`No scenario found for id: ${savedIssuanceFlow.id}`)
    })

    it('Should update scenario in database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id, persona2.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedIssuanceFlow: NewIssuanceFlow = {
            ...savedIssuanceFlow,
            name: 'new_name',
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title1',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text1',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        },
                        {
                            title: 'example_title2',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text2',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            issuer: (<IssuanceFlow>savedIssuanceFlow).issuer!.id,
            personas: [persona1.id]
        }
        const updatedIssuanceFlowResult = await repository.update(savedIssuanceFlow.id, updatedIssuanceFlow)

        expect(updatedIssuanceFlowResult).toBeDefined()
        expect(updatedIssuanceFlowResult.name).toEqual(updatedIssuanceFlow.name)
        expect(updatedIssuanceFlowResult.description).toEqual(updatedIssuanceFlow.description)
        expect(updatedIssuanceFlowResult.steps).toBeDefined();
        expect(updatedIssuanceFlowResult.steps.length).toEqual(1)
        expect(updatedIssuanceFlowResult.steps[0].title).toEqual(updatedIssuanceFlow.steps[0].title)
        expect(updatedIssuanceFlowResult.steps[0].order).toEqual(updatedIssuanceFlow.steps[0].order)
        expect(updatedIssuanceFlowResult.steps[0].type).toEqual(updatedIssuanceFlow.steps[0].type)
        expect(updatedIssuanceFlowResult.steps[0].actions.length).toEqual(2)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].id).toBeDefined()
        expect(updatedIssuanceFlowResult.steps[0].actions[0].title).toEqual(updatedIssuanceFlow.steps[0].actions[0].title)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].actionType).toEqual(updatedIssuanceFlow.steps[0].actions[0].actionType)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].text).toEqual(updatedIssuanceFlow.steps[0].actions[0].text)
        expect(updatedIssuanceFlowResult.steps[0].asset).not.toBeNull()
        expect(updatedIssuanceFlowResult.steps[0].asset!.mediaType).toEqual(asset.mediaType)
        expect(updatedIssuanceFlowResult.steps[0].asset!.fileName).toEqual(asset.fileName)
        expect(updatedIssuanceFlowResult.steps[0].asset!.description).toEqual(asset.description)
        expect(updatedIssuanceFlowResult.steps[0].asset!.content).toStrictEqual(asset.content)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest).not.toBeNull()
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.attributes).not.toBeNull()
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.predicates).not.toBeNull()
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(updatedIssuanceFlowResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
        expect(updatedIssuanceFlowResult.personas).toBeDefined();
        expect(updatedIssuanceFlowResult.personas.length).toEqual(1)
        expect(updatedIssuanceFlowResult.personas[0].name).toEqual(persona1.name)
        expect(updatedIssuanceFlowResult.personas[0].role).toEqual(persona1.role)
        expect(updatedIssuanceFlowResult.personas[0].description).toEqual(persona1.description)
        expect(updatedIssuanceFlowResult.personas[0].headshotImage).not.toBeNull()
        expect(updatedIssuanceFlowResult.personas[0].headshotImage!.id).toBeDefined();
        expect(updatedIssuanceFlowResult.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
        expect(updatedIssuanceFlowResult.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
        expect(updatedIssuanceFlowResult.personas[0].headshotImage!.description).toEqual(asset.description)
        expect(updatedIssuanceFlowResult.personas[0].headshotImage!.content).toStrictEqual(asset.content)
        expect(updatedIssuanceFlowResult.personas[0].bodyImage).not.toBeNull()
        expect(updatedIssuanceFlowResult.personas[0].bodyImage!.id).toBeDefined();
        expect(updatedIssuanceFlowResult.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
        expect(updatedIssuanceFlowResult.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
        expect(updatedIssuanceFlowResult.personas[0].bodyImage!.description).toEqual(asset.description)
        expect(updatedIssuanceFlowResult.personas[0].bodyImage!.content).toStrictEqual(asset.content)
    })

    it('Should throw error when updating scenario with no steps', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedIssuanceFlow: NewIssuanceFlow = {
            ...savedIssuanceFlow,
            steps: [],
            issuer: (<IssuanceFlow>savedIssuanceFlow).issuer!.id,
            personas: [persona1.id]
        }

        await expect(repository.update(savedIssuanceFlow.id, updatedIssuanceFlow)).rejects.toThrowError(`At least one step is required`)
    })

    it('Should throw error when updating scenario with invalid issuer id', async (): Promise<void> => {
        const unknownIssuerId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedIssuanceFlow: NewIssuanceFlow = {
            ...savedIssuanceFlow,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
            ],
            issuer: unknownIssuerId,
            personas: [persona1.id]
        }

        await expect(repository.update(savedIssuanceFlow.id, updatedIssuanceFlow)).rejects.toThrowError(`No issuer found for id: ${unknownIssuerId}`)
    })

    it('Should throw error when updating scenario with invalid persona id', async (): Promise<void> => {
        const unknownPersonaId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedIssuanceFlow: NewIssuanceFlow = {
            ...savedIssuanceFlow,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
            ],
            issuer: issuer.id,
            personas: [unknownPersonaId]
        }

        await expect(repository.update(savedIssuanceFlow.id, updatedIssuanceFlow)).rejects.toThrowError(`No persona found for id: ${unknownPersonaId}`)
    })

    it('Should throw error when updating scenario with no personas', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedIssuanceFlow: NewIssuanceFlow = {
            ...savedIssuanceFlow,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
            ],
            issuer: (<IssuanceFlow>savedIssuanceFlow).issuer!.id,
            personas: []
        }

        await expect(repository.update(savedIssuanceFlow.id, updatedIssuanceFlow)).rejects.toThrowError(`At least one persona is required`)
    })

    it('Should add scenario step to database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const step: NewStep = {
            title: 'example_title',
            description: 'example_description',
            order: 2,
            type: StepType.HUMAN_TASK,
            asset: asset.id,
            actions: [
                {
                    title: 'example_title1',
                    actionType: StepActionType.ARIES_OOB,
                    text: 'example_text1',
                    proofRequest: {
                        attributes: {
                            attribute1: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            },
                            attribute2: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            }
                        },
                        predicates: {
                            predicate1: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            },
                            predicate2: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            }
                        }
                    }
                },
                {
                    title: 'example_title2',
                    actionType: StepActionType.ARIES_OOB,
                    text: 'example_text2',
                    proofRequest: {
                        attributes: {
                            attribute1: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            },
                            attribute2: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            }
                        },
                        predicates: {
                            predicate1: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            },
                            predicate2: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            }
                        }
                    }
                }
            ]
        };
        const savedStep = await repository.createStep(savedIssuanceFlow.id, step)
        expect(savedStep).toBeDefined();

        const fromDb = await repository.findById(savedIssuanceFlow.id)
        expect(fromDb).toBeDefined()

        expect(fromDb.steps).toBeDefined();
        expect(fromDb.steps.length).toEqual(2)
        expect(fromDb.steps[1].title).toEqual(step.title)
        expect(fromDb.steps[1].order).toEqual(step.order)
        expect(fromDb.steps[1].type).toEqual(step.type)
        expect(fromDb.steps[1].actions.length).toEqual(2)
        expect(fromDb.steps[1].actions[0].id).toBeDefined()
        expect(fromDb.steps[1].actions[0].title).toEqual(step.actions[0].title)
        expect(fromDb.steps[1].actions[0].actionType).toEqual(step.actions[0].actionType)
        expect(fromDb.steps[1].actions[0].text).toEqual(step.actions[0].text)
        expect(fromDb.steps[1].asset).not.toBeNull()
        expect(fromDb.steps[1].asset!.mediaType).toEqual(asset.mediaType)
        expect(fromDb.steps[1].asset!.fileName).toEqual(asset.fileName)
        expect(fromDb.steps[1].asset!.description).toEqual(asset.description)
        expect(fromDb.steps[1].asset!.content).toStrictEqual(asset.content);
        expect(fromDb.steps[1].actions[0].proofRequest).not.toBeNull()
        expect(fromDb.steps[1].actions[0].proofRequest!.attributes).not.toBeNull()
        expect(fromDb.steps[1].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
        expect(fromDb.steps[1].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(fromDb.steps[1].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(fromDb.steps[1].actions[0].proofRequest!.predicates).not.toBeNull()
        expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
        expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    })

    it('Should throw error when adding scenario step with no actions', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const step: NewStep = {
            title: 'example_title',
            description: 'example_description',
            order: 2,
            type: StepType.HUMAN_TASK,
            asset: asset.id,
            actions: []
        };

        await expect(repository.createStep(savedIssuanceFlow.id, step)).rejects.toThrowError(`At least one action is required`)
    })

    it('Should get scenario step by step id from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title1',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text1',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        },
                        {
                            title: 'example_title2',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text2',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const fromDb = await repository.findByStepId(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id)

        expect(fromDb).toBeDefined()
        expect(fromDb.id).toEqual(savedIssuanceFlow.steps[0].id)
        expect(fromDb.title).toEqual(issuanceFlow.steps[0].title)
        expect(fromDb.order).toEqual(issuanceFlow.steps[0].order)
        expect(fromDb.type).toEqual(issuanceFlow.steps[0].type)
        expect(fromDb.actions.length).toEqual(2)
        expect(fromDb.actions[0].id).toBeDefined()
        expect(fromDb.actions[0].title).toEqual(issuanceFlow.steps[0].actions[0].title)
        expect(fromDb.actions[0].actionType).toEqual(issuanceFlow.steps[0].actions[0].actionType)
        expect(fromDb.actions[0].text).toEqual(issuanceFlow.steps[0].actions[0].text)
        expect(fromDb.asset).not.toBeNull()
        expect(fromDb.asset!.mediaType).toEqual(asset.mediaType)
        expect(fromDb.asset!.fileName).toEqual(asset.fileName)
        expect(fromDb.asset!.description).toEqual(asset.description)
        expect(fromDb.asset!.content).toStrictEqual(asset.content);
        expect(fromDb.actions[0].proofRequest).not.toBeNull()
        expect(fromDb.actions[0].proofRequest!.attributes).not.toBeNull()
        expect(fromDb.actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
        expect(fromDb.actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(fromDb.actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(fromDb.actions[0].proofRequest!.predicates).not.toBeNull()
        expect(fromDb.actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
        expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    })

    it('Should get all scenario steps from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const fromDb = await repository.findAllSteps(savedIssuanceFlow.id)

        expect(fromDb).toBeDefined()
        expect(fromDb.length).toEqual(2)
        expect(fromDb[0].id).toBeDefined()
        expect(fromDb[0].title).toEqual(issuanceFlow.steps[0].title)
        expect(fromDb[0].order).toEqual(issuanceFlow.steps[0].order)
        expect(fromDb[0].type).toEqual(issuanceFlow.steps[0].type)
        expect(fromDb[0].actions.length).toEqual(1)
        expect(fromDb[0].actions[0].id).toBeDefined()
        expect(fromDb[0].actions[0].title).toEqual(issuanceFlow.steps[0].actions[0].title)
        expect(fromDb[0].actions[0].actionType).toEqual(issuanceFlow.steps[0].actions[0].actionType)
        expect(fromDb[0].actions[0].text).toEqual(issuanceFlow.steps[0].actions[0].text)
        expect(fromDb[0].asset).not.toBeNull()
        expect(fromDb[0].asset!.mediaType).toEqual(asset.mediaType)
        expect(fromDb[0].asset!.fileName).toEqual(asset.fileName)
        expect(fromDb[0].asset!.description).toEqual(asset.description)
        expect(fromDb[0].asset!.content).toStrictEqual(asset.content);
    })

    it('Should delete scenario step from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 2,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()
        expect(savedIssuanceFlow.steps).toBeDefined();
        expect(savedIssuanceFlow.steps.length).toEqual(2)

        await repository.deleteStep(savedIssuanceFlow.id, savedIssuanceFlow.steps[1].id)
        const fromDb = await repository.findById(savedIssuanceFlow.id)

        expect(fromDb.steps).toBeDefined();
        expect(fromDb.steps.length).toEqual(1)
    })

    it('Should update scenario step in database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedStep: NewStep = {
            ...savedIssuanceFlow.steps[0],
            title: 'new_title',
            actions: [
                {
                    title: 'example_title1',
                    actionType: StepActionType.ARIES_OOB,
                    text: 'example_text1',
                    proofRequest: {
                        attributes: {
                            attribute1: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            },
                            attribute2: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            }
                        },
                        predicates: {
                            predicate1: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            },
                            predicate2: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            }
                        }
                    }
                },
                {
                    title: 'example_title2',
                    actionType: StepActionType.ARIES_OOB,
                    text: 'example_text2',
                    proofRequest: {
                        attributes: {
                            attribute1: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            },
                            attribute2: {
                                attributes: ['attribute1', 'attribute2'],
                                restrictions: ['restriction1', 'restriction2']
                            }
                        },
                        predicates: {
                            predicate1: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            },
                            predicate2: {
                                name: 'example_name',
                                type: 'example_type',
                                value: 'example_value',
                                restrictions: ['restriction1', 'restriction2']
                            }
                        }
                    }
                }
            ],
            asset: savedIssuanceFlow.steps[0].asset!.id
        }
        const updatedStepResult = await repository.updateStep(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id, updatedStep)

        expect(updatedStepResult).toBeDefined()
        expect(updatedStepResult.title).toEqual(updatedStep.title)
        expect(updatedStepResult.order).toEqual(updatedStep.order)
        expect(updatedStepResult.type).toEqual(updatedStep.type)
        expect(updatedStepResult.actions.length).toEqual(2)
        expect(updatedStepResult.actions[0].id).toBeDefined()
        expect(updatedStepResult.actions[0].title).toEqual(updatedStep.actions[0].title)
        expect(updatedStepResult.actions[0].actionType).toEqual(updatedStep.actions[0].actionType)
        expect(updatedStepResult.actions[0].text).toEqual(updatedStep.actions[0].text)
        expect(updatedStepResult.asset).not.toBeNull()
        expect(updatedStepResult.asset!.mediaType).toEqual(asset.mediaType)
        expect(updatedStepResult.asset!.fileName).toEqual(asset.fileName)
        expect(updatedStepResult.asset!.description).toEqual(asset.description)
        expect(updatedStepResult.asset!.content).toStrictEqual(asset.content)
        expect(updatedStepResult.actions[0].proofRequest).not.toBeNull()
        expect(updatedStepResult.actions[0].proofRequest!.attributes).not.toBeNull()
        expect(updatedStepResult.actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
        expect(updatedStepResult.actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(updatedStepResult.actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(updatedStepResult.actions[0].proofRequest!.predicates).not.toBeNull()
        expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
        expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    })

    it('Should throw error when updating scenario step with no actions', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedStep: NewStep = {
            ...savedIssuanceFlow.steps[0],
            actions: [],
            asset: savedIssuanceFlow.steps[0].asset!.id
        }

        await expect(repository.updateStep(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id, updatedStep)).rejects.toThrowError(`At least one action is required`)
    })

    it('Should add to scenario step action to database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const action: NewAriesOOBAction = {
            title: 'example_title',
            actionType: StepActionType.ARIES_OOB,
            text: 'example_text',
            proofRequest: {
                attributes: {
                    attribute1: {
                        attributes: ['attribute1', 'attribute2'],
                        restrictions: ['restriction1', 'restriction2']
                    },
                    attribute2: {
                        attributes: ['attribute1', 'attribute2'],
                        restrictions: ['restriction1', 'restriction2']
                    }
                },
                predicates: {
                    predicate1: {
                        name: 'example_name',
                        type: 'example_type',
                        value: 'example_value',
                        restrictions: ['restriction1', 'restriction2']
                    },
                    predicate2: {
                        name: 'example_name',
                        type: 'example_type',
                        value: 'example_value',
                        restrictions: ['restriction1', 'restriction2']
                    }
                }
            }
        };
        const savedStepAction = await repository.createStepAction(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id, action)
        expect(savedStepAction).toBeDefined();

        const fromDb = await repository.findById(savedIssuanceFlow.id)
        expect(fromDb).toBeDefined()

        expect(fromDb.steps).toBeDefined();
        expect(fromDb.steps.length).toEqual(1)
        expect(fromDb.steps[0].actions).toBeDefined()
        expect(fromDb.steps[0].actions.length).toEqual(2)
        expect(fromDb.steps[0].actions[1].id).toBeDefined()
        expect(fromDb.steps[0].actions[1].title).toEqual(action.title)
        expect(fromDb.steps[0].actions[1].actionType).toEqual(action.actionType)
        expect(fromDb.steps[0].actions[1].text).toEqual(action.text)
        expect(fromDb.steps[0].actions[1].proofRequest).not.toBeNull()
        expect(fromDb.steps[0].actions[1].proofRequest!.attributes).not.toBeNull()
        expect(fromDb.steps[0].actions[1].proofRequest!.attributes!.attribute1).toBeDefined()
        expect(fromDb.steps[0].actions[1].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(fromDb.steps[0].actions[1].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(fromDb.steps[0].actions[1].proofRequest!.predicates).not.toBeNull()
        expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1).toBeDefined()
        expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    })

    it('Should get scenario step action by action id from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const fromDb = await repository.findByStepActionId(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id, savedIssuanceFlow.steps[0].actions[0].id)

        expect(fromDb.id).toEqual(savedIssuanceFlow.steps[0].actions[0].id)
        expect(fromDb.title).toEqual(issuanceFlow.steps[0].actions[0].title)
        expect(fromDb.actionType).toEqual(issuanceFlow.steps[0].actions[0].actionType)
        expect(fromDb.text).toEqual(issuanceFlow.steps[0].actions[0].text)
        expect(fromDb.proofRequest).not.toBeNull()
        expect(fromDb.proofRequest!.attributes).not.toBeNull()
        expect(fromDb.proofRequest!.attributes!.attribute1).toBeDefined()
        expect(fromDb.proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(fromDb.proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(fromDb.proofRequest!.predicates).not.toBeNull()
        expect(fromDb.proofRequest!.predicates!.predicate1).toBeDefined()
        expect(fromDb.proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(fromDb.proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(fromDb.proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(fromDb.proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    })

    it('Should get all scenario step actions from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        },
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const fromDb = await repository.findAllStepActions(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id)

        expect(fromDb).toBeDefined()
        expect(fromDb.length).toEqual(2)
        expect(fromDb[0].id).toBeDefined()
        expect(fromDb[0].title).toEqual(issuanceFlow.steps[0].actions[0].title)
        expect(fromDb[0].actionType).toEqual(issuanceFlow.steps[0].actions[0].actionType)
        expect(fromDb[0].text).toEqual(issuanceFlow.steps[0].actions[0].text)
    })

    it('Should delete scenario step action from database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        },
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()
        expect(savedIssuanceFlow.steps[0].actions).toBeDefined();
        expect(savedIssuanceFlow.steps[0].actions.length).toEqual(2)

        await repository.deleteStepAction(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id, savedIssuanceFlow.steps[0].actions[1].id)
        const fromDb = await repository.findById(savedIssuanceFlow.id)

        expect(fromDb.steps[0].actions).toBeDefined();
        expect(fromDb.steps[0].actions.length).toEqual(1)
    })

    it('Should update scenario step action in database', async (): Promise<void> => {
        const issuanceFlow: NewIssuanceFlow = {
            name: 'example_name',
            description: 'example_description',
            issuer: issuer.id,
            steps: [
                {
                    title: 'example_title',
                    description: 'example_description',
                    order: 1,
                    type: StepType.HUMAN_TASK,
                    asset: asset.id,
                    actions: [
                        {
                            title: 'example_title',
                            actionType: StepActionType.ARIES_OOB,
                            text: 'example_text',
                            proofRequest: {
                                attributes: {
                                    attribute1: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    attribute2: {
                                        attributes: ['attribute1', 'attribute2'],
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                },
                                predicates: {
                                    predicate1: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    },
                                    predicate2: {
                                        name: 'example_name',
                                        type: 'example_type',
                                        value: 'example_value',
                                        restrictions: ['restriction1', 'restriction2']
                                    }
                                }
                            }
                        }
                    ]
                }
            ],
            personas: [persona1.id]
        };

        const savedIssuanceFlow = await repository.create(issuanceFlow)
        expect(savedIssuanceFlow).toBeDefined()

        const updatedStepAction: NewAriesOOBAction = {
            ...savedIssuanceFlow.steps[0].actions[0],
            title: 'new_title',
            proofRequest: savedIssuanceFlow.steps[0].actions[0].proofRequest!
        }
        const updatedStepResult = await repository.updateStepAction(savedIssuanceFlow.id, savedIssuanceFlow.steps[0].id, savedIssuanceFlow.steps[0].actions[0].id, updatedStepAction)

        expect(updatedStepResult).toBeDefined();
        expect(updatedStepResult.id).toBeDefined()
        expect(updatedStepResult.title).toEqual(updatedStepAction.title)
        expect(updatedStepResult.actionType).toEqual(updatedStepAction.actionType)
        expect(updatedStepResult.text).toEqual(updatedStepAction.text)
        expect(updatedStepResult.proofRequest).not.toBeNull()
        expect(updatedStepResult.proofRequest!.attributes).not.toBeNull()
        expect(updatedStepResult.proofRequest!.attributes!.attribute1).toBeDefined()
        expect(updatedStepResult.proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
        expect(updatedStepResult.proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
        expect(updatedStepResult.proofRequest!.predicates).not.toBeNull()
        expect(updatedStepResult.proofRequest!.predicates!.predicate1).toBeDefined()
        expect(updatedStepResult.proofRequest!.predicates!.predicate1.name).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
        expect(updatedStepResult.proofRequest!.predicates!.predicate1.type).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
        expect(updatedStepResult.proofRequest!.predicates!.predicate1.value).toEqual(issuanceFlow.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
        expect(updatedStepResult.proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    })
})
