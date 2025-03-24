import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Container } from 'typedi'
import DatabaseService from '../../../services/DatabaseService'
import ScenarioRepository from '../../../database/repositories/ScenarioRepository'
import IssuerRepository from '../../../database/repositories/IssuerRepository'
import CredentialDefinitionRepository from '../../../database/repositories/CredentialDefinitionRepository'
import AssetRepository from '../../../database/repositories/AssetRepository'
import PersonaRepository from '../PersonaRepository'
import RelyingPartyRepository from '../RelyingPartyRepository'
import CredentialSchemaRepository from '../CredentialSchemaRepository'
import * as schema from '../../../database/schema'
import {
  Asset,
  CredentialAttributeType,
  CredentialDefinition,
  CredentialType,
  IdentifierType,
  IssuanceScenario,
  Issuer,
  IssuerType,
  NewAriesOOBAction,
  NewAsset,
  NewCredentialDefinition,
  NewCredentialSchema,
  NewIssuanceScenario,
  NewIssuer,
  NewPersona,
  NewPresentationScenario,
  NewRelyingParty,
  NewStep,
  Persona,
  PresentationScenario,
  RelyingParty,
  RelyingPartyType,
  ScenarioType,
  StepActionType,
  StepType,
} from '../../../types'

describe('Database scenario repository tests', (): void => {
  let client: PGlite
  let repository: ScenarioRepository
  let issuer: Issuer
  let relyingParty: RelyingParty
  let asset: Asset
  let persona1: Persona
  let persona2: Persona
  let credentialDefinition: CredentialDefinition

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/credential-showcase-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    repository = Container.get(ScenarioRepository)
    const issuerRepository = Container.get(IssuerRepository)
    const relyingPartyRepository = Container.get(RelyingPartyRepository)
    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const credentialSchemaRepository = Container.get(CredentialSchemaRepository)
    const assetRepository = Container.get(AssetRepository)
    const newAsset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }
    asset = await assetRepository.create(newAsset)

    const newCredentialSchema: NewCredentialSchema = {
      name: 'example_name',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      attributes: [
        {
          name: 'example_attribute_name1',
          value: 'example_attribute_value1',
          type: CredentialAttributeType.STRING,
        },
        {
          name: 'example_attribute_name2',
          value: 'example_attribute_value2',
          type: CredentialAttributeType.STRING,
        },
      ],
    }
    const credentialSchema = await credentialSchemaRepository.create(newCredentialSchema)

    const newCredentialDefinition: NewCredentialDefinition = {
      name: 'example_name',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      revocation: {
        // TODO SHOWCASE-80 AnonCredRevocation
        title: 'example_revocation_title',
        description: 'example_revocation_description',
      },
    }
    credentialDefinition = await credentialDefinitionRepository.create(newCredentialDefinition)
    const newIssuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }
    issuer = await issuerRepository.create(newIssuer)
    const newRelyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }
    relyingParty = await relyingPartyRepository.create(newRelyingParty)
    const personaRepository = Container.get(PersonaRepository)
    const newPersona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }
    persona1 = await personaRepository.create(newPersona)
    persona2 = await personaRepository.create(newPersona)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save issuance scenario to database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
          credentialDefinition: credentialDefinition.id,
          actions: [
            {
              title: 'example_title',
              actionType: StepActionType.ARIES_OOB,
              text: 'example_text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id, persona2.id],
      bannerImage: asset.id,
      hidden: true,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)

    expect(savedIssuanceScenario).toBeDefined()
    expect(savedIssuanceScenario.name).toEqual(issuanceScenario.name)
    expect(savedIssuanceScenario.slug).toEqual('example-name')
    expect(savedIssuanceScenario.description).toEqual(issuanceScenario.description)
    expect(savedIssuanceScenario.hidden).toEqual(issuanceScenario.hidden)
    expect(savedIssuanceScenario.steps).toBeDefined()
    expect(savedIssuanceScenario.steps.length).toEqual(2)
    expect(savedIssuanceScenario.steps[0].title).toEqual(issuanceScenario.steps[0].title)
    expect(savedIssuanceScenario.steps[0].order).toEqual(issuanceScenario.steps[0].order)
    expect(savedIssuanceScenario.steps[0].type).toEqual(issuanceScenario.steps[0].type)
    expect(savedIssuanceScenario.steps[0].credentialDefinition).toBeDefined()
    expect(savedIssuanceScenario.steps[0].credentialDefinition).toEqual(credentialDefinition.id)
    expect(savedIssuanceScenario.steps[0].actions.length).toEqual(1)
    expect(savedIssuanceScenario.steps[0].actions[0].id).toBeDefined()
    expect(savedIssuanceScenario.steps[0].actions[0].title).toEqual(issuanceScenario.steps[0].actions[0].title)
    expect(savedIssuanceScenario.steps[0].actions[0].actionType).toEqual(issuanceScenario.steps[0].actions[0].actionType)
    expect(savedIssuanceScenario.steps[0].actions[0].text).toEqual(issuanceScenario.steps[0].actions[0].text)
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest).not.toBeNull()
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.attributes).not.toBeNull()
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.predicates).not.toBeNull()
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(savedIssuanceScenario.steps[0].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    expect(savedIssuanceScenario.steps[0].asset).not.toBeNull()
    expect(savedIssuanceScenario.steps[0].asset!.mediaType).toEqual(asset.mediaType)
    expect(savedIssuanceScenario.steps[0].asset!.fileName).toEqual(asset.fileName)
    expect(savedIssuanceScenario.steps[0].asset!.description).toEqual(asset.description)
    expect(savedIssuanceScenario.steps[0].asset!.content).toStrictEqual(asset.content)
    expect(savedIssuanceScenario.steps[1].credentialDefinition).toBeNull()
    expect((<IssuanceScenario>savedIssuanceScenario).issuer).not.toBeNull()
    expect((<IssuanceScenario>savedIssuanceScenario).issuer!.name).toEqual(issuer.name)
    expect((<IssuanceScenario>savedIssuanceScenario).issuer!.credentialDefinitions.length).toEqual(1)
    expect((<IssuanceScenario>savedIssuanceScenario).issuer!.description).toEqual(issuer.description)
    expect((<IssuanceScenario>savedIssuanceScenario).issuer!.organization).toEqual(issuer.organization)
    expect((<IssuanceScenario>savedIssuanceScenario).issuer!.logo).not.toBeNull()
    expect(savedIssuanceScenario.personas).toBeDefined()
    expect(savedIssuanceScenario.personas.length).toEqual(2)
    expect(savedIssuanceScenario.personas[0].name).toEqual(persona1.name)
    expect(savedIssuanceScenario.personas[0].role).toEqual(persona1.role)
    expect(savedIssuanceScenario.personas[0].description).toEqual(persona1.description)
    expect(savedIssuanceScenario.personas[0].headshotImage).not.toBeNull()
    expect(savedIssuanceScenario.personas[0].headshotImage!.id).toBeDefined()
    expect(savedIssuanceScenario.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
    expect(savedIssuanceScenario.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
    expect(savedIssuanceScenario.personas[0].headshotImage!.description).toEqual(asset.description)
    expect(savedIssuanceScenario.personas[0].headshotImage!.content).toStrictEqual(asset.content)
    expect(savedIssuanceScenario.personas[0].bodyImage).not.toBeNull()
    expect(savedIssuanceScenario.personas[0].bodyImage!.id).toBeDefined()
    expect(savedIssuanceScenario.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
    expect(savedIssuanceScenario.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
    expect(savedIssuanceScenario.personas[0].bodyImage!.description).toEqual(asset.description)
    expect(savedIssuanceScenario.personas[0].bodyImage!.content).toStrictEqual(asset.content)
    expect(savedIssuanceScenario.bannerImage!.id).toBeDefined()
    expect(savedIssuanceScenario.bannerImage!.mediaType).toEqual(asset.mediaType)
    expect(savedIssuanceScenario.bannerImage!.fileName).toEqual(asset.fileName)
    expect(savedIssuanceScenario.bannerImage!.description).toEqual(asset.description)
    expect(savedIssuanceScenario.bannerImage!.content).toStrictEqual(asset.content)
  })

  it('Should save presentation scenario to database', async (): Promise<void> => {
    const presentationScenario: NewPresentationScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id, persona2.id],
      bannerImage: asset.id,
      hidden: true,
    }

    const savedPresentationScenario = await repository.create(presentationScenario)

    expect(savedPresentationScenario).toBeDefined()
    expect(savedPresentationScenario.name).toEqual(presentationScenario.name)
    expect(savedPresentationScenario.description).toEqual(presentationScenario.description)
    expect(savedPresentationScenario.hidden).toEqual(presentationScenario.hidden)
    expect(savedPresentationScenario.steps).toBeDefined()
    expect(savedPresentationScenario.steps.length).toEqual(2)
    expect(savedPresentationScenario.steps[0].title).toEqual(presentationScenario.steps[0].title)
    expect(savedPresentationScenario.steps[0].order).toEqual(presentationScenario.steps[0].order)
    expect(savedPresentationScenario.steps[0].type).toEqual(presentationScenario.steps[0].type)
    expect(savedPresentationScenario.steps[0].actions.length).toEqual(1)
    expect(savedPresentationScenario.steps[0].actions[0].id).toBeDefined()
    expect(savedPresentationScenario.steps[0].actions[0].title).toEqual(presentationScenario.steps[0].actions[0].title)
    expect(savedPresentationScenario.steps[0].actions[0].actionType).toEqual(presentationScenario.steps[0].actions[0].actionType)
    expect(savedPresentationScenario.steps[0].actions[0].text).toEqual(presentationScenario.steps[0].actions[0].text)
    expect(savedPresentationScenario.steps[0].asset).not.toBeNull()
    expect(savedPresentationScenario.steps[0].asset!.mediaType).toEqual(asset.mediaType)
    expect(savedPresentationScenario.steps[0].asset!.fileName).toEqual(asset.fileName)
    expect(savedPresentationScenario.steps[0].asset!.description).toEqual(asset.description)
    expect(savedPresentationScenario.steps[0].asset!.content).toStrictEqual(asset.content)
    expect((<PresentationScenario>savedPresentationScenario).relyingParty).not.toBeNull()
    expect((<PresentationScenario>savedPresentationScenario).relyingParty!.name).toEqual(relyingParty.name)
    expect((<PresentationScenario>savedPresentationScenario).relyingParty!.credentialDefinitions.length).toEqual(1)
    expect((<PresentationScenario>savedPresentationScenario).relyingParty!.description).toEqual(relyingParty.description)
    expect((<PresentationScenario>savedPresentationScenario).relyingParty!.organization).toEqual(relyingParty.organization)
    expect((<PresentationScenario>savedPresentationScenario).relyingParty!.logo).not.toBeNull()
    expect(savedPresentationScenario.personas).toBeDefined()
    expect(savedPresentationScenario.personas.length).toEqual(2)
    expect(savedPresentationScenario.personas[0].name).toEqual(persona1.name)
    expect(savedPresentationScenario.personas[0].role).toEqual(persona1.role)
    expect(savedPresentationScenario.personas[0].description).toEqual(persona1.description)
    expect(savedPresentationScenario.personas[0].headshotImage).not.toBeNull()
    expect(savedPresentationScenario.personas[0].headshotImage!.id).toBeDefined()
    expect(savedPresentationScenario.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
    expect(savedPresentationScenario.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
    expect(savedPresentationScenario.personas[0].headshotImage!.description).toEqual(asset.description)
    expect(savedPresentationScenario.personas[0].headshotImage!.content).toStrictEqual(asset.content)
    expect(savedPresentationScenario.personas[0].bodyImage).not.toBeNull()
    expect(savedPresentationScenario.personas[0].bodyImage!.id).toBeDefined()
    expect(savedPresentationScenario.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
    expect(savedPresentationScenario.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
    expect(savedPresentationScenario.personas[0].bodyImage!.description).toEqual(asset.description)
    expect(savedPresentationScenario.personas[0].bodyImage!.content).toStrictEqual(asset.content)
    expect(savedPresentationScenario.bannerImage!.id).toBeDefined()
    expect(savedPresentationScenario.bannerImage!.mediaType).toEqual(asset.mediaType)
    expect(savedPresentationScenario.bannerImage!.fileName).toEqual(asset.fileName)
    expect(savedPresentationScenario.bannerImage!.description).toEqual(asset.description)
    expect(savedPresentationScenario.bannerImage!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when saving scenario with no steps', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
      name: 'example_name',
      description: 'example_description',
      issuer: issuer.id,
      steps: [],
      personas: [persona1.id],
      hidden: false,
    }

    await expect(repository.create(issuanceScenario)).rejects.toThrowError(`At least one step is required`)
  })

  it('Should throw error when saving scenario with invalid issuer id', async (): Promise<void> => {
    const unknownIssuerId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    await expect(repository.create(issuanceScenario)).rejects.toThrowError(`No issuer found for id: ${unknownIssuerId}`)
  })

  it('Should throw error when saving scenario with banner image id', async (): Promise<void> => {
    const unknownBannerImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      bannerImage: unknownBannerImageId,
      hidden: false,
    }

    await expect(repository.create(issuanceScenario)).rejects.toThrowError(`No asset found for id: ${unknownBannerImageId}`)
  })

  it('Should throw error when saving scenario with duplicate step order', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    await expect(repository.create(issuanceScenario)).rejects.toThrowError(
      'duplicate key value violates unique constraint "step_order_scenario_unique"',
    ) // FIXME would be nice if we can set a custom error message returns by a constraint
  })

  it('Should throw error when saving scenario with invalid persona id', async (): Promise<void> => {
    const unknownPersonaId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [unknownPersonaId],
      hidden: false,
    }

    await expect(repository.create(issuanceScenario)).rejects.toThrowError(`No persona found for id: ${unknownPersonaId}`)
  })

  it('Should throw error when saving scenario with no personas', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [],
      hidden: false,
    }

    await expect(repository.create(issuanceScenario)).rejects.toThrowError(`At least one persona is required`)
  })

  it('Should get scenario by id from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id, persona2.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const fromDb = await repository.findById(savedIssuanceScenario.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(issuanceScenario.name)
    expect(fromDb.description).toEqual(issuanceScenario.description)
    expect(fromDb.hidden).toEqual(issuanceScenario.hidden)
    expect(fromDb.steps).toBeDefined()
    expect(fromDb.steps.length).toEqual(2)
    expect(fromDb.steps[0].actions[0].proofRequest).not.toBeNull()
    expect(fromDb.steps[0].actions[0].proofRequest!.attributes).not.toBeNull()
    expect(fromDb.steps[0].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
    expect(fromDb.steps[0].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
    expect(fromDb.steps[0].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
    expect(fromDb.steps[0].actions[0].proofRequest!.predicates).not.toBeNull()
    expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
    expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(fromDb.steps[0].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    expect(fromDb.personas).toBeDefined()
    expect(fromDb.personas.length).toEqual(2)
    expect(fromDb.personas[0].name).toEqual(persona1.name)
    expect(fromDb.personas[0].role).toEqual(persona1.role)
    expect(fromDb.personas[0].description).toEqual(persona1.description)
    expect(fromDb.personas[0].headshotImage).not.toBeNull()
    expect(fromDb.personas[0].headshotImage!.id).toBeDefined()
    expect(fromDb.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
    expect(fromDb.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
    expect(fromDb.personas[0].headshotImage!.description).toEqual(asset.description)
    expect(fromDb.personas[0].headshotImage!.content).toStrictEqual(asset.content)
    expect(fromDb.personas[0].bodyImage).not.toBeNull()
    expect(fromDb.personas[0].bodyImage!.id).toBeDefined()
    expect(fromDb.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
    expect(fromDb.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
    expect(fromDb.personas[0].bodyImage!.description).toEqual(asset.description)
    expect(fromDb.personas[0].bodyImage!.content).toStrictEqual(asset.content)
  })

  it('Should get all scenarios from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id, persona2.id],
      hidden: false,
    }

    const savedIssuanceScenario1 = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario1).toBeDefined()

    const savedIssuanceScenario2 = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario2).toBeDefined()

    const fromDb = await repository.findAll({ filter: { scenarioType: ScenarioType.ISSUANCE } })

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete scenario from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    await repository.delete(savedIssuanceScenario.id)

    await expect(repository.findById(savedIssuanceScenario.id)).rejects.toThrowError(`No scenario found for id: ${savedIssuanceScenario.id}`)
  })

  it('Should update scenario in database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id, persona2.id],
      hidden: true,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedIssuanceScenario: NewIssuanceScenario = {
      ...savedIssuanceScenario,
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
            {
              title: 'example_title2',
              actionType: StepActionType.ARIES_OOB,
              text: 'example_text2',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      issuer: (<IssuanceScenario>savedIssuanceScenario).issuer!.id,
      personas: [persona1.id],
      bannerImage: null,
    }
    const updatedIssuanceScenarioResult = await repository.update(savedIssuanceScenario.id, updatedIssuanceScenario)

    expect(updatedIssuanceScenarioResult).toBeDefined()
    expect(updatedIssuanceScenarioResult.name).toEqual(updatedIssuanceScenario.name)
    expect(updatedIssuanceScenarioResult.slug).toEqual('new-name')
    expect(updatedIssuanceScenarioResult.description).toEqual(updatedIssuanceScenario.description)
    expect(updatedIssuanceScenarioResult.hidden).toEqual(updatedIssuanceScenario.hidden)
    expect(updatedIssuanceScenarioResult.steps).toBeDefined()
    expect(updatedIssuanceScenarioResult.steps.length).toEqual(1)
    expect(updatedIssuanceScenarioResult.steps[0].title).toEqual(updatedIssuanceScenario.steps[0].title)
    expect(updatedIssuanceScenarioResult.steps[0].order).toEqual(updatedIssuanceScenario.steps[0].order)
    expect(updatedIssuanceScenarioResult.steps[0].type).toEqual(updatedIssuanceScenario.steps[0].type)
    expect(updatedIssuanceScenarioResult.steps[0].actions.length).toEqual(2)
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].id).toBeDefined()
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].title).toEqual(updatedIssuanceScenario.steps[0].actions[0].title)
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].actionType).toEqual(updatedIssuanceScenario.steps[0].actions[0].actionType)
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].text).toEqual(updatedIssuanceScenario.steps[0].actions[0].text)
    expect(updatedIssuanceScenarioResult.steps[0].asset).not.toBeNull()
    expect(updatedIssuanceScenarioResult.steps[0].asset!.mediaType).toEqual(asset.mediaType)
    expect(updatedIssuanceScenarioResult.steps[0].asset!.fileName).toEqual(asset.fileName)
    expect(updatedIssuanceScenarioResult.steps[0].asset!.description).toEqual(asset.description)
    expect(updatedIssuanceScenarioResult.steps[0].asset!.content).toStrictEqual(asset.content)
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest).not.toBeNull()
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.attributes).not.toBeNull()
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.predicates).not.toBeNull()
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(updatedIssuanceScenarioResult.steps[0].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
    expect(updatedIssuanceScenarioResult.personas).toBeDefined()
    expect(updatedIssuanceScenarioResult.personas.length).toEqual(1)
    expect(updatedIssuanceScenarioResult.personas[0].name).toEqual(persona1.name)
    expect(updatedIssuanceScenarioResult.personas[0].role).toEqual(persona1.role)
    expect(updatedIssuanceScenarioResult.personas[0].description).toEqual(persona1.description)
    expect(updatedIssuanceScenarioResult.personas[0].headshotImage).not.toBeNull()
    expect(updatedIssuanceScenarioResult.personas[0].headshotImage!.id).toBeDefined()
    expect(updatedIssuanceScenarioResult.personas[0].headshotImage!.mediaType).toEqual(asset.mediaType)
    expect(updatedIssuanceScenarioResult.personas[0].headshotImage!.fileName).toEqual(asset.fileName)
    expect(updatedIssuanceScenarioResult.personas[0].headshotImage!.description).toEqual(asset.description)
    expect(updatedIssuanceScenarioResult.personas[0].headshotImage!.content).toStrictEqual(asset.content)
    expect(updatedIssuanceScenarioResult.personas[0].bodyImage).not.toBeNull()
    expect(updatedIssuanceScenarioResult.personas[0].bodyImage!.id).toBeDefined()
    expect(updatedIssuanceScenarioResult.personas[0].bodyImage!.mediaType).toEqual(asset.mediaType)
    expect(updatedIssuanceScenarioResult.personas[0].bodyImage!.fileName).toEqual(asset.fileName)
    expect(updatedIssuanceScenarioResult.personas[0].bodyImage!.description).toEqual(asset.description)
    expect(updatedIssuanceScenarioResult.personas[0].bodyImage!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when updating scenario with no steps', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedIssuanceScenario: NewIssuanceScenario = {
      ...savedIssuanceScenario,
      steps: [],
      issuer: (<IssuanceScenario>savedIssuanceScenario).issuer!.id,
      personas: [persona1.id],
      bannerImage: null,
    }

    await expect(repository.update(savedIssuanceScenario.id, updatedIssuanceScenario)).rejects.toThrowError(`At least one step is required`)
  })

  it('Should throw error when updating scenario with invalid issuer id', async (): Promise<void> => {
    const unknownIssuerId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedIssuanceScenario: NewIssuanceScenario = {
      ...savedIssuanceScenario,
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      issuer: unknownIssuerId,
      personas: [persona1.id],
      bannerImage: null,
    }

    await expect(repository.update(savedIssuanceScenario.id, updatedIssuanceScenario)).rejects.toThrowError(
      `No issuer found for id: ${unknownIssuerId}`,
    )
  })

  it('Should throw error when updating scenario with invalid issuer id', async (): Promise<void> => {
    const unknownIssuerId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedIssuanceScenario: NewIssuanceScenario = {
      ...savedIssuanceScenario,
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      issuer: unknownIssuerId,
      personas: [persona1.id],
      bannerImage: null,
    }

    await expect(repository.update(savedIssuanceScenario.id, updatedIssuanceScenario)).rejects.toThrowError(
      `No issuer found for id: ${unknownIssuerId}`,
    )
  })

  it('Should throw error when updating scenario with invalid banner image id', async (): Promise<void> => {
    const unknownBannerImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedIssuanceScenario: NewIssuanceScenario = {
      ...savedIssuanceScenario,
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      issuer: issuer.id,
      personas: [persona1.id],
      bannerImage: unknownBannerImageId,
    }

    await expect(repository.update(savedIssuanceScenario.id, updatedIssuanceScenario)).rejects.toThrowError(
      `No asset found for id: ${unknownBannerImageId}`,
    )
  })

  it('Should throw error when updating scenario with no personas', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedIssuanceScenario: NewIssuanceScenario = {
      ...savedIssuanceScenario,
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      issuer: (<IssuanceScenario>savedIssuanceScenario).issuer!.id,
      personas: [],
      bannerImage: null,
    }

    await expect(repository.update(savedIssuanceScenario.id, updatedIssuanceScenario)).rejects.toThrowError(`At least one persona is required`)
  })

  it('Should add scenario step to database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

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
                restrictions: ['restriction1', 'restriction2'],
              },
              attribute2: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
            },
            predicates: {
              predicate1: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
              predicate2: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
            },
          },
        },
        {
          title: 'example_title2',
          actionType: StepActionType.ARIES_OOB,
          text: 'example_text2',
          proofRequest: {
            attributes: {
              attribute1: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
              attribute2: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
            },
            predicates: {
              predicate1: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
              predicate2: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
            },
          },
        },
      ],
    }
    const savedStep = await repository.createStep(savedIssuanceScenario.id, step)
    expect(savedStep).toBeDefined()

    const fromDb = await repository.findById(savedIssuanceScenario.id)
    expect(fromDb).toBeDefined()

    expect(fromDb.steps).toBeDefined()
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
    expect(fromDb.steps[1].asset!.content).toStrictEqual(asset.content)
    expect(fromDb.steps[1].actions[0].proofRequest).not.toBeNull()
    expect(fromDb.steps[1].actions[0].proofRequest!.attributes).not.toBeNull()
    expect(fromDb.steps[1].actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
    expect(fromDb.steps[1].actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
    expect(fromDb.steps[1].actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
    expect(fromDb.steps[1].actions[0].proofRequest!.predicates).not.toBeNull()
    expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
    expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(fromDb.steps[1].actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
  })

  it('Should throw error when adding scenario step with no actions', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const step: NewStep = {
      title: 'example_title',
      description: 'example_description',
      order: 2,
      type: StepType.HUMAN_TASK,
      asset: asset.id,
      actions: [],
    }

    await expect(repository.createStep(savedIssuanceScenario.id, step)).rejects.toThrowError(`At least one action is required`)
  })

  it('Should get scenario step by step id from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
            {
              title: 'example_title2',
              actionType: StepActionType.ARIES_OOB,
              text: 'example_text2',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const fromDb = await repository.findByStepId(savedIssuanceScenario.id, savedIssuanceScenario.steps[0].id)

    expect(fromDb).toBeDefined()
    expect(fromDb.id).toEqual(savedIssuanceScenario.steps[0].id)
    expect(fromDb.title).toEqual(issuanceScenario.steps[0].title)
    expect(fromDb.order).toEqual(issuanceScenario.steps[0].order)
    expect(fromDb.type).toEqual(issuanceScenario.steps[0].type)
    expect(fromDb.actions.length).toEqual(2)
    expect(fromDb.actions[0].id).toBeDefined()
    expect(fromDb.actions[0].title).toEqual(issuanceScenario.steps[0].actions[0].title)
    expect(fromDb.actions[0].actionType).toEqual(issuanceScenario.steps[0].actions[0].actionType)
    expect(fromDb.actions[0].text).toEqual(issuanceScenario.steps[0].actions[0].text)
    expect(fromDb.asset).not.toBeNull()
    expect(fromDb.asset!.mediaType).toEqual(asset.mediaType)
    expect(fromDb.asset!.fileName).toEqual(asset.fileName)
    expect(fromDb.asset!.description).toEqual(asset.description)
    expect(fromDb.asset!.content).toStrictEqual(asset.content)
    expect(fromDb.actions[0].proofRequest).not.toBeNull()
    expect(fromDb.actions[0].proofRequest!.attributes).not.toBeNull()
    expect(fromDb.actions[0].proofRequest!.attributes!.attribute1).toBeDefined()
    expect(fromDb.actions[0].proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
    expect(fromDb.actions[0].proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
    expect(fromDb.actions[0].proofRequest!.predicates).not.toBeNull()
    expect(fromDb.actions[0].proofRequest!.predicates!.predicate1).toBeDefined()
    expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(fromDb.actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
  })

  it('Should get all scenario steps from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const fromDb = await repository.findAllSteps(savedIssuanceScenario.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.length).toEqual(2)
    expect(fromDb[0].id).toBeDefined()
    expect(fromDb[0].title).toEqual(issuanceScenario.steps[0].title)
    expect(fromDb[0].order).toEqual(issuanceScenario.steps[0].order)
    expect(fromDb[0].type).toEqual(issuanceScenario.steps[0].type)
    expect(fromDb[0].actions.length).toEqual(1)
    expect(fromDb[0].actions[0].id).toBeDefined()
    expect(fromDb[0].actions[0].title).toEqual(issuanceScenario.steps[0].actions[0].title)
    expect(fromDb[0].actions[0].actionType).toEqual(issuanceScenario.steps[0].actions[0].actionType)
    expect(fromDb[0].actions[0].text).toEqual(issuanceScenario.steps[0].actions[0].text)
    expect(fromDb[0].asset).not.toBeNull()
    expect(fromDb[0].asset!.mediaType).toEqual(asset.mediaType)
    expect(fromDb[0].asset!.fileName).toEqual(asset.fileName)
    expect(fromDb[0].asset!.description).toEqual(asset.description)
    expect(fromDb[0].asset!.content).toStrictEqual(asset.content)
  })

  it('Should delete scenario step from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()
    expect(savedIssuanceScenario.steps).toBeDefined()
    expect(savedIssuanceScenario.steps.length).toEqual(2)

    await repository.deleteStep(savedIssuanceScenario.id, savedIssuanceScenario.steps[1].id)
    const fromDb = await repository.findById(savedIssuanceScenario.id)

    expect(fromDb.steps).toBeDefined()
    expect(fromDb.steps.length).toEqual(1)
  })

  it('Should update scenario step in database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedStep: NewStep = {
      ...savedIssuanceScenario.steps[0],
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
                restrictions: ['restriction1', 'restriction2'],
              },
              attribute2: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
            },
            predicates: {
              predicate1: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
              predicate2: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
            },
          },
        },
        {
          title: 'example_title2',
          actionType: StepActionType.ARIES_OOB,
          text: 'example_text2',
          proofRequest: {
            attributes: {
              attribute1: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
              attribute2: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
            },
            predicates: {
              predicate1: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
              predicate2: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
            },
          },
        },
      ],
      asset: savedIssuanceScenario.steps[0].asset!.id,
    }
    const updatedStepResult = await repository.updateStep(savedIssuanceScenario.id, savedIssuanceScenario.steps[0].id, updatedStep)

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
    expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(updatedStepResult.actions[0].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
  })

  it('Should throw error when updating scenario step with no actions', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedStep: NewStep = {
      ...savedIssuanceScenario.steps[0],
      actions: [],
      asset: savedIssuanceScenario.steps[0].asset!.id,
    }

    await expect(repository.updateStep(savedIssuanceScenario.id, savedIssuanceScenario.steps[0].id, updatedStep)).rejects.toThrowError(
      `At least one action is required`,
    )
  })

  it('Should add to scenario step action to database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const action: NewAriesOOBAction = {
      title: 'example_title',
      actionType: StepActionType.ARIES_OOB,
      text: 'example_text',
      proofRequest: {
        attributes: {
          attribute1: {
            attributes: ['attribute1', 'attribute2'],
            restrictions: ['restriction1', 'restriction2'],
          },
          attribute2: {
            attributes: ['attribute1', 'attribute2'],
            restrictions: ['restriction1', 'restriction2'],
          },
        },
        predicates: {
          predicate1: {
            name: 'example_name',
            type: 'example_type',
            value: 'example_value',
            restrictions: ['restriction1', 'restriction2'],
          },
          predicate2: {
            name: 'example_name',
            type: 'example_type',
            value: 'example_value',
            restrictions: ['restriction1', 'restriction2'],
          },
        },
      },
    }
    const savedStepAction = await repository.createStepAction(savedIssuanceScenario.id, savedIssuanceScenario.steps[0].id, action)
    expect(savedStepAction).toBeDefined()

    const fromDb = await repository.findById(savedIssuanceScenario.id)
    expect(fromDb).toBeDefined()

    expect(fromDb.steps).toBeDefined()
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
    expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(fromDb.steps[0].actions[1].proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
  })

  it('Should get scenario step action by action id from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const fromDb = await repository.findByStepActionId(
      savedIssuanceScenario.id,
      savedIssuanceScenario.steps[0].id,
      savedIssuanceScenario.steps[0].actions[0].id,
    )

    expect(fromDb.id).toEqual(savedIssuanceScenario.steps[0].actions[0].id)
    expect(fromDb.title).toEqual(issuanceScenario.steps[0].actions[0].title)
    expect(fromDb.actionType).toEqual(issuanceScenario.steps[0].actions[0].actionType)
    expect(fromDb.text).toEqual(issuanceScenario.steps[0].actions[0].text)
    expect(fromDb.proofRequest).not.toBeNull()
    expect(fromDb.proofRequest!.attributes).not.toBeNull()
    expect(fromDb.proofRequest!.attributes!.attribute1).toBeDefined()
    expect(fromDb.proofRequest!.attributes!.attribute1.attributes!.length).toEqual(2)
    expect(fromDb.proofRequest!.attributes!.attribute1.restrictions!.length).toEqual(2)
    expect(fromDb.proofRequest!.predicates).not.toBeNull()
    expect(fromDb.proofRequest!.predicates!.predicate1).toBeDefined()
    expect(fromDb.proofRequest!.predicates!.predicate1.name).toEqual(issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name)
    expect(fromDb.proofRequest!.predicates!.predicate1.type).toEqual(issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type)
    expect(fromDb.proofRequest!.predicates!.predicate1.value).toEqual(issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value)
    expect(fromDb.proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
  })

  it('Should get all scenario step actions from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
            {
              title: 'example_title',
              actionType: StepActionType.ARIES_OOB,
              text: 'example_text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const fromDb = await repository.findAllStepActions(savedIssuanceScenario.id, savedIssuanceScenario.steps[0].id)

    expect(fromDb).toBeDefined()
    expect(fromDb.length).toEqual(2)
    expect(fromDb[0].id).toBeDefined()
    expect(fromDb[0].title).toEqual(issuanceScenario.steps[0].actions[0].title)
    expect(fromDb[0].actionType).toEqual(issuanceScenario.steps[0].actions[0].actionType)
    expect(fromDb[0].text).toEqual(issuanceScenario.steps[0].actions[0].text)
  })

  it('Should delete scenario step action from database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
            {
              title: 'example_title',
              actionType: StepActionType.ARIES_OOB,
              text: 'example_text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()
    expect(savedIssuanceScenario.steps[0].actions).toBeDefined()
    expect(savedIssuanceScenario.steps[0].actions.length).toEqual(2)

    await repository.deleteStepAction(savedIssuanceScenario.id, savedIssuanceScenario.steps[0].id, savedIssuanceScenario.steps[0].actions[1].id)
    const fromDb = await repository.findById(savedIssuanceScenario.id)

    expect(fromDb.steps[0].actions).toBeDefined()
    expect(fromDb.steps[0].actions.length).toEqual(1)
  })

  it('Should update scenario step action in database', async (): Promise<void> => {
    const issuanceScenario: NewIssuanceScenario = {
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
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id],
      hidden: false,
    }

    const savedIssuanceScenario = await repository.create(issuanceScenario)
    expect(savedIssuanceScenario).toBeDefined()

    const updatedStepAction: NewAriesOOBAction = {
      ...savedIssuanceScenario.steps[0].actions[0],
      title: 'new_title',
      proofRequest: savedIssuanceScenario.steps[0].actions[0].proofRequest!,
    }
    const updatedStepResult = await repository.updateStepAction(
      savedIssuanceScenario.id,
      savedIssuanceScenario.steps[0].id,
      savedIssuanceScenario.steps[0].actions[0].id,
      updatedStepAction,
    )

    expect(updatedStepResult).toBeDefined()
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
    expect(updatedStepResult.proofRequest!.predicates!.predicate1.name).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.name,
    )
    expect(updatedStepResult.proofRequest!.predicates!.predicate1.type).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.type,
    )
    expect(updatedStepResult.proofRequest!.predicates!.predicate1.value).toEqual(
      issuanceScenario.steps[0].actions[0].proofRequest!.predicates.predicate1.value,
    )
    expect(updatedStepResult.proofRequest!.predicates!.predicate1.restrictions!.length).toEqual(2)
  })
})
