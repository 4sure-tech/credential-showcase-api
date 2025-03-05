import 'reflect-metadata';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Container } from 'typedi';
import * as schema from '../../schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import DatabaseService from '../../../services/DatabaseService';
import ShowcaseRepository from '../ShowcaseRepository';
import IssuerRepository from '../IssuerRepository';
import CredentialDefinitionRepository from '../CredentialDefinitionRepository';
import AssetRepository from '../AssetRepository';
import PersonaRepository from '../PersonaRepository';
import ScenarioRepository from '../ScenarioRepository';
import {
    CredentialAttributeType,
    CredentialDefinition,
    CredentialType,
    IssuanceFlow,
    IssuerType,
    NewAsset,
    NewCredentialDefinition,
    NewIssuanceFlow,
    NewIssuer,
    NewPersona,
    NewShowcase,
    Persona,
    ShowcaseStatus,
    StepActionType,
    StepType
} from '../../../types';

describe('Database showcase repository tests', (): void => {
    let client: PGlite;
    let repository: ShowcaseRepository;
    let persona1: Persona
    let persona2: Persona
    let issuanceFlow1: IssuanceFlow
    let issuanceFlow2: IssuanceFlow
    let credentialDefinition1: CredentialDefinition
    let credentialDefinition2: CredentialDefinition

    beforeEach(async (): Promise<void> => {
        client = new PGlite();
        const database = drizzle(client, { schema }) as unknown as NodePgDatabase;
        await migrate(database, { migrationsFolder: './apps/credential-showcase-api-server/src/database/migrations' })
        const mockDatabaseService = {
            getConnection: jest.fn().mockResolvedValue(database),
        };
        Container.set(DatabaseService, mockDatabaseService);
        repository = Container.get(ShowcaseRepository);
        const issuerRepository = Container.get(IssuerRepository);
        const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository);
        const assetRepository = Container.get(AssetRepository);
        const newAsset: NewAsset = {
            mediaType: 'image/png',
            fileName: 'image.png',
            description: 'some image',
            content: Buffer.from('some binary data')
        };
        const asset = await assetRepository.create(newAsset);
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
        credentialDefinition1 = await credentialDefinitionRepository.create(newCredentialDefinition);
        credentialDefinition2 = await credentialDefinitionRepository.create(newCredentialDefinition);
        const newIssuer: NewIssuer = {
            name: 'example_name',
            type: IssuerType.ARIES,
            credentialDefinitions: [credentialDefinition1.id],
            description: 'example_description',
            organization: 'example_organization',
            logo: asset.id,
        };
        const issuer = await issuerRepository.create(newIssuer);
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
        const scenarioRepository = Container.get(ScenarioRepository);
        const newIssuanceFlow: NewIssuanceFlow = {
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
        issuanceFlow1 = await scenarioRepository.create(newIssuanceFlow)
        issuanceFlow2 = await scenarioRepository.create(newIssuanceFlow)
    })

    afterEach(async (): Promise<void> => {
        await client.close();
        jest.resetAllMocks();
        Container.reset();
    });

    it('Should save showcase to database', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        expect(savedShowcase).toBeDefined()
        expect(savedShowcase.name).toEqual(showcase.name)
        expect(savedShowcase.description).toEqual(showcase.description)
        expect(savedShowcase.status).toEqual(showcase.status)
        expect(savedShowcase.hidden).toEqual(showcase.hidden);
        expect(savedShowcase.scenarios.length).toEqual(2);
        expect(savedShowcase.credentialDefinitions.length).toEqual(2);
        expect(savedShowcase.personas.length).toEqual(2);
    })

    it('Should throw error when saving showcase with no personas', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: []
        };

        await expect(repository.create(showcase)).rejects.toThrowError(`At least one persona is required`)
    })

    it('Should throw error when saving showcase with no credential definitions', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [],
            personas: [persona1.id, persona2.id]
        };

        await expect(repository.create(showcase)).rejects.toThrowError(`At least one credential definition is required`)
    })

    it('Should throw error when saving showcase with no workflows', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        await expect(repository.create(showcase)).rejects.toThrowError(`At least one scenario is required`)
    })

    it('Should throw error when saving showcase with invalid persona id', async (): Promise<void> => {
        const unknownPersonaId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [unknownPersonaId]
        };

        await expect(repository.create(showcase)).rejects.toThrowError(`No persona found for id: ${unknownPersonaId}`)
    })

    it('Should throw error when saving showcase with invalid credential definition id', async (): Promise<void> => {
        const unknownCredentialDefinitionId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [unknownCredentialDefinitionId],
            personas: [persona1.id, persona2.id]
        };

        await expect(repository.create(showcase)).rejects.toThrowError(`No credential definition found for id: ${unknownCredentialDefinitionId}`)
    })

    it('Should throw error when saving showcase with invalid scenario id', async (): Promise<void> => {
        const unknownScenarioId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [unknownScenarioId],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        await expect(repository.create(showcase)).rejects.toThrowError(`No scenario found for id: ${unknownScenarioId}`)
    })

    it('Should get showcase by id from database', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)
        expect(savedShowcase).toBeDefined()

        const fromDb = await repository.findById(savedShowcase.id)

        expect(fromDb).toBeDefined()
        expect(fromDb.name).toEqual(showcase.name)
        expect(fromDb.description).toEqual(showcase.description)
        expect(fromDb.status).toEqual(showcase.status)
        expect(fromDb.hidden).toEqual(showcase.hidden);
        expect(fromDb.scenarios.length).toEqual(2);
        expect(fromDb.credentialDefinitions.length).toEqual(2);
        expect(fromDb.personas.length).toEqual(2);
    })

    it('Should get all showcases from database', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase1 = await repository.create(showcase)
        expect(savedShowcase1).toBeDefined()

        const savedShowcase2 = await repository.create(showcase)
        expect(savedShowcase2).toBeDefined()

        const fromDb = await repository.findAll()

        expect(fromDb).toBeDefined()
        expect(fromDb.length).toEqual(2)
    })

    it('Should delete showcase from database', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)
        expect(savedShowcase).toBeDefined()

        await repository.delete(savedShowcase.id)

        await expect(repository.findById(savedShowcase.id)).rejects.toThrowError(`No showcase found for id: ${savedShowcase.id}`)
    })

    it('Should update showcase in database', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        const newName = 'new_name'
        const updatedShowcase = await repository.update(savedShowcase.id, {
            ...savedShowcase,
            name: newName,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        })

        expect(updatedShowcase).toBeDefined()
        expect(updatedShowcase.name).toEqual(newName)
        expect(updatedShowcase.description).toEqual(showcase.description)
        expect(updatedShowcase.status).toEqual(showcase.status)
        expect(updatedShowcase.hidden).toEqual(showcase.hidden);
        expect(updatedShowcase.scenarios.length).toEqual(2);
        expect(updatedShowcase.credentialDefinitions.length).toEqual(2);
        expect(updatedShowcase.personas.length).toEqual(2);
    })

    it('Should throw error when updating showcase with no personas', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        const updatedShowcase: NewShowcase = {
            ...savedShowcase,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: []
        }

        await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(`At least one persona is required`)
    })

    it('Should throw error when updating showcase with no credential definitions', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        const updatedShowcase: NewShowcase = {
            ...savedShowcase,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [],
            personas: [persona1.id, persona2.id]
        }

        await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(`At least one credential definition is required`)
    })

    it('Should throw error when updating showcase with no workflows', async (): Promise<void> => {
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        const updatedShowcase: NewShowcase = {
            ...savedShowcase,
            scenarios: [],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        }

        await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(`At least one scenario is required`)
    })

    it('Should throw error when updating showcase with invalid persona id', async (): Promise<void> => {
        const unknownPersonaId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        const updatedShowcase: NewShowcase = {
            ...savedShowcase,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [unknownPersonaId]
        }

        await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(`No persona found for id: ${unknownPersonaId}`)
    })

    it('Should throw error when updating showcase with invalid credential definition id', async (): Promise<void> => {
        const unknownCredentialDefinitionId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        const updatedShowcase: NewShowcase = {
            ...savedShowcase,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [unknownCredentialDefinitionId],
            personas: [persona1.id, persona2.id]
        }

        await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(`No credential definition found for id: ${unknownCredentialDefinitionId}`)
    })

    it('Should throw error when updating showcase with invalid scenario id', async (): Promise<void> => {
        const unknownScenarioId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
        const showcase: NewShowcase = {
            name: 'example_name',
            description: 'example_description',
            status: ShowcaseStatus.ACTIVE,
            hidden: false,
            scenarios: [issuanceFlow1.id, issuanceFlow2.id],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        };

        const savedShowcase = await repository.create(showcase)

        const updatedShowcase: NewShowcase = {
            ...savedShowcase,
            scenarios: [unknownScenarioId],
            credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
            personas: [persona1.id, persona2.id]
        }

        await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(`No scenario found for id: ${unknownScenarioId}`)
    })

})
