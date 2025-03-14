import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import ShowcaseController from '../ShowcaseController'
import { Application } from 'express'
import { CredentialAttributeType, CredentialType, IdentifierType, IssuerType, ShowcaseStatus, StepActionType, StepType } from '../../types'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import ShowcaseService from '../../services/ShowcaseService'
import { Showcase, ShowcaseExpand, ShowcaseRequest } from 'credential-showcase-openapi'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'
import { Buffer } from 'buffer'
import supertest = require('supertest')

describe('ShowcaseController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  // Helper function to create common prerequisites
  async function createTestPrerequisites() {
    const assetRepository = Container.get(AssetRepository)
    const asset = await assetRepository.create({
      mediaType: 'image/png',
      fileName: 'test.png',
      description: 'Test image',
      content: Buffer.from('binary data'),
    })

    const credentialSchemaRepository = Container.get(CredentialSchemaRepository)
    const credentialSchema = await credentialSchemaRepository.create({
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
    })

    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const credentialDefinition = await credentialDefinitionRepository.create({
      name: 'Test Definition',
      version: '1.0',
      identifierType: IdentifierType.DID,
      identifier: 'did:test:123',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    })

    const issuerRepository = Container.get(IssuerRepository)
    const issuer = await issuerRepository.create({
      name: 'Test Issuer',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      credentialSchemas: [credentialSchema.id],
      description: 'Test issuer description',
      organization: 'Test Organization',
      logo: asset.id,
    })

    // Create a persona
    const personaRepository = Container.get(PersonaRepository)
    const persona = await personaRepository.create({
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    })

    // Create an issuance scenario with at least one step
    const scenarioRepository = Container.get(ScenarioRepository)
    const scenario = await scenarioRepository.create({
      name: 'Test Scenario',
      description: 'Test scenario description',
      issuer: issuer.id, // This makes it an issuance scenario
      steps: [
        {
          title: 'Test Step',
          description: 'Test step description',
          order: 1,
          type: StepType.HUMAN_TASK,
          asset: asset.id,
          actions: [
            {
              title: 'Test Action',
              actionType: StepActionType.ARIES_OOB,
              text: 'Test action text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {},
              },
            },
          ],
        },
      ],
      personas: [persona.id],
      hidden: false,
    })

    return { asset, credentialSchema, credentialDefinition, issuer, persona, scenario }
  }

  beforeAll(async () => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/credential-showcase-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    // Initialize all repositories and services
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(IssuerRepository)
    Container.get(PersonaRepository)
    Container.get(ScenarioRepository)
    Container.get(ShowcaseRepository)
    Container.get(ShowcaseService)
    app = createExpressServer({
      controllers: [ShowcaseController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a showcase', async () => {
    const { asset, credentialDefinition, persona, scenario } = await createTestPrerequisites()

    const showcaseRequest: ShowcaseRequest = {
      name: 'Test Showcase',
      description: 'Test showcase description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      credentialDefinitions: [credentialDefinition.id],
      personas: [persona.id],
      bannerImage: asset.id,
      completionMessage: 'Congratulations on completing the showcase!',
    }

    const createResponse = await request.post('/showcases').send(showcaseRequest).expect(201)

    const createdShowcase = createResponse.body.showcase
    expect(createdShowcase).toHaveProperty('id')
    expect(createdShowcase.name).toEqual('Test Showcase')
    expect(createdShowcase.status).toEqual(ShowcaseStatus.ACTIVE)
    expect(createdShowcase.scenarios.length).toEqual(1)
    expect(createdShowcase.credentialDefinitions.length).toEqual(1)
    expect(createdShowcase.personas.length).toEqual(1)
    expect(createdShowcase.bannerImage).toBeDefined()
    expect(createdShowcase.completionMessage).toEqual('Congratulations on completing the showcase!')

    // 2. Retrieve all showcases
    const getAllResponse = await request.get('/showcases').expect(200)
    expect(getAllResponse.body.showcases).toBeInstanceOf(Array)
    expect(getAllResponse.body.showcases.length).toBe(1)

    // 3. Retrieve the created showcase
    const getResponse = await request.get(`/showcases/${createdShowcase.slug}`).expect(200)
    expect(getResponse.body.showcase.name).toEqual('Test Showcase')

    // 4. Update the showcase
    const updatedRequest = {
      ...showcaseRequest,
      name: 'Updated Showcase Name',
      description: 'Updated showcase description',
      status: ShowcaseStatus.PENDING,
    }

    const updateResponse = await request.put(`/showcases/${createdShowcase.slug}`).send(updatedRequest).expect(200)
    expect(updateResponse.body.showcase.name).toEqual('Updated Showcase Name')
    expect(updateResponse.body.showcase.description).toEqual('Updated showcase description')
    expect(updateResponse.body.showcase.status).toEqual(ShowcaseStatus.PENDING)

    await request.delete(`/showcases/${updateResponse.body.showcase.slug}`).expect(204)
    await request.get(`/showcases/${updateResponse.body.showcase.slug}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentSlug = '00000000-0000-0000-0000-000000000000'

    // Try to get a non-existent showcase
    await request.get(`/showcases/${nonExistentSlug}`).expect(404)
  })

  it('should validate request data when creating a showcase', async () => {
    // Attempt to create a showcase with missing required fields
    const invalidShowcaseRequest = {
      // Missing name, description, etc.
    }

    await request.post('/showcases').send(invalidShowcaseRequest).expect(400)

    // Attempt to create a showcase with non-existent IDs
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const invalidShowcaseRequest2: ShowcaseRequest = {
      name: 'Invalid Showcase',
      description: 'Test description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [nonExistentId],
      credentialDefinitions: [nonExistentId],
      personas: [nonExistentId],
    }

    await request.post('/showcases').send(invalidShowcaseRequest2).expect(404)
  })

  it('should retrieve a showcase with no expands', async () => {
    const { asset, scenario } = await createTestPrerequisites()
    const { credentialDefinition, persona } = await createTestPrerequisites()

    const showcaseRequest: ShowcaseRequest = {
      name: 'Expand Test Showcase',
      description: 'Testing expand options',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      credentialDefinitions: [credentialDefinition.id],
      personas: [persona.id],
      bannerImage: asset.id,
      completionMessage: 'Completion message',
    }

    const createResponse = await request.post('/showcases').send(showcaseRequest).expect(201)
    const createdShowcase = createResponse.body.showcase

    // Retrieve without any expands
    const getResponse = await request.get(`/showcases/${createdShowcase.slug}`).expect(200)

    // Verify no related entities are expanded
    expect(getResponse.body.showcase.scenarios).toEqual([])
    expect(getResponse.body.showcase.credentialDefinitions).toEqual([])
    expect(getResponse.body.showcase.personas).toEqual([])
    expect(getResponse.body.showcase.bannerImage).toBeUndefined()
    expect(getResponse.body.showcase.bannerImageId).toBe(asset.id)
  })

  it('should retrieve a showcase with all expands except asset content', async () => {
    const { asset, scenario, credentialDefinition, persona } = await createTestPrerequisites()
    const showcaseRequest: ShowcaseRequest = {
      name: 'All Expands Showcase',
      description: 'Testing all expands except asset content',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      credentialDefinitions: [credentialDefinition.id],
      personas: [persona.id],
      bannerImage: asset.id,
      completionMessage: 'Testing completion message',
    }

    const createResponse = await request.post('/showcases').send(showcaseRequest).expect(201)
    const createdShowcase = createResponse.body.showcase

    // Retrieve with all expands except asset content
    const getResponse = await request
      .get(
        `/showcases/${createdShowcase.slug}?expand=${ShowcaseExpand.Scenarios}&expand=${ShowcaseExpand.CredentialDefinitions}&expand=${ShowcaseExpand.Personas}`,
      )
      .expect(200)

    // Verify related entities are expanded
    expect(getResponse.body.showcase.scenarios.length).toEqual(1)
    expect(getResponse.body.showcase.credentialDefinitions.length).toEqual(1)
    expect(getResponse.body.showcase.personas.length).toEqual(1)

    // Verify completionMessage is preserved
    expect(getResponse.body.showcase.completionMessage).toEqual('Testing completion message')

    // Verify banner image is a string ID without content
    expect(typeof getResponse.body.showcase.bannerImageId).toBe('string')

    // Check that persona image references are string IDs
    const responsePersona = getResponse.body.showcase.personas[0]
    expect(typeof responsePersona.headshotImageId).toBe('string')
    expect(typeof responsePersona.bodyImageId).toBe('string')

    // Check that scenario assets are string IDs
    const step = getResponse.body.showcase.scenarios[0].steps[0]
    expect(typeof step.assetId).toBe('string')
  })

  it('should retrieve a showcase with all expands including asset content', async () => {
    const { asset, scenario, credentialDefinition, persona } = await createTestPrerequisites()
    const showcaseRequest: ShowcaseRequest = {
      name: 'Assets Content Showcase',
      description: 'Testing all expands with asset content',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      credentialDefinitions: [credentialDefinition.id],
      personas: [persona.id],
      bannerImage: asset.id,
      completionMessage: 'Asset content test completion message',
    }

    const createResponse = await request.post('/showcases').send(showcaseRequest).expect(201)
    const createdShowcase = createResponse.body.showcase

    // Retrieve with all expands including asset content
    const getResponse = await request
      .get(
        `/showcases/${createdShowcase.slug}?expand=${ShowcaseExpand.Scenarios}&expand=${ShowcaseExpand.CredentialDefinitions}&expand=${ShowcaseExpand.Personas}&expand=${ShowcaseExpand.AssetContent}`,
      )
      .expect(200)

    // Verify related entities are expanded
    expect(getResponse.body.showcase.scenarios.length).toEqual(1)
    expect(getResponse.body.showcase.credentialDefinitions.length).toEqual(1)
    expect(getResponse.body.showcase.personas.length).toEqual(1)

    // Verify completionMessage is preserved
    expect(getResponse.body.showcase.completionMessage).toEqual('Asset content test completion message')

    // Verify banner image is an object with content
    expect(typeof getResponse.body.showcase.bannerImage).toBe('object')
    expect(getResponse.body.showcase.bannerImage).toHaveProperty('id')
    expect(getResponse.body.showcase.bannerImage).toHaveProperty('mediaType')
    expect(getResponse.body.showcase.bannerImage).toHaveProperty('fileName')
    expect(getResponse.body.showcase.bannerImage).toHaveProperty('content')

    // Check that persona image references have content
    const responsePersona = getResponse.body.showcase.personas[0]
    expect(typeof responsePersona.headshotImage).toBe('object')
    expect(responsePersona.headshotImage).toHaveProperty('content')
    expect(typeof responsePersona.bodyImage).toBe('object')
    expect(responsePersona.bodyImage).toHaveProperty('content')

    // Check that scenario assets have content
    const step = getResponse.body.showcase.scenarios[0].steps[0]
    expect(typeof step.asset).toBe('object')
    expect(step.asset).toHaveProperty('content')
  })

  it('should retrieve all showcases with various expand combinations', async () => {
    const { asset, credentialSchema } = await createTestPrerequisites()

    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const credentialDefinition = await credentialDefinitionRepository.create({
      name: 'Test Definition',
      version: '1.0',
      identifierType: IdentifierType.DID,
      identifier: 'did:test:123',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    })

    const issuerRepository = Container.get(IssuerRepository)
    const issuer = await issuerRepository.create({
      name: 'Test Issuer',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      credentialSchemas: [credentialSchema.id],
      description: 'Test issuer description',
      organization: 'Test Organization',
      logo: asset.id,
    })

    // Create a persona
    const personaRepository = Container.get(PersonaRepository)
    const persona = await personaRepository.create({
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    })

    // Create an issuance scenario with at least one step
    const scenarioRepository = Container.get(ScenarioRepository)
    const scenario = await scenarioRepository.create({
      name: 'Test Scenario',
      description: 'Test scenario description',
      issuer: issuer.id, // This makes it an issuance scenario
      steps: [
        {
          title: 'Test Step',
          description: 'Test step description',
          order: 1,
          type: StepType.HUMAN_TASK,
          asset: asset.id,
          actions: [
            {
              title: 'Test Action',
              actionType: StepActionType.ARIES_OOB,
              text: 'Test action text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {},
              },
            },
          ],
        },
      ],
      personas: [persona.id],
      hidden: false,
    })

    // Create two showcases
    const showcaseRequest1: ShowcaseRequest = {
      name: 'First Test Showcase',
      description: 'Testing expand options',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      credentialDefinitions: [credentialDefinition.id],
      personas: [persona.id],
      bannerImage: asset.id,
      completionMessage: 'First showcase completion message',
    }

    const showcaseRequest2: ShowcaseRequest = {
      name: 'Second Test Showcase',
      description: 'Testing expand options',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      credentialDefinitions: [credentialDefinition.id],
      personas: [persona.id],
      completionMessage: 'Second showcase completion message',
    }

    await request.post('/showcases').send(showcaseRequest1).expect(201)
    await request.post('/showcases').send(showcaseRequest2).expect(201)

    // Test 1: Get all with no expands
    const response1 = await request.get('/showcases').expect(200)
    expect(response1.body.showcases.length).toBeGreaterThanOrEqual(2)
    expect(response1.body.showcases[0].scenarios).toEqual([])
    expect(response1.body.showcases[0].credentialDefinitions).toEqual([])
    expect(response1.body.showcases[0].personas).toEqual([])
    expect(response1.body.showcases[0].completionMessage).toBeDefined()

    // Test 2: Get all with only scenarios expanded
    const response2 = await request.get(`/showcases?expand=${ShowcaseExpand.Scenarios}`).expect(200)
    expect(response2.body.showcases.length).toBeGreaterThanOrEqual(2)
    expect(response2.body.showcases[0].scenarios.length).toBeGreaterThanOrEqual(1)
    expect(response2.body.showcases[0].credentialDefinitions).toEqual([])
    expect(response2.body.showcases[0].personas).toEqual([])
    expect(response2.body.showcases[0].completionMessage).toBeDefined()

    // Test 3: Get all with scenarios and credential definitions expanded
    const response3 = await request.get(`/showcases?expand=scenarios&expand=credentialdefinitions`).expect(200) // Test normalization
    expect(response3.body.showcases.length).toBeGreaterThanOrEqual(2)
    expect(response3.body.showcases[0].scenarios.length).toBeGreaterThanOrEqual(1)
    expect(response3.body.showcases[0].credentialDefinitions.length).toBeGreaterThanOrEqual(1)
    expect(response3.body.showcases[0].personas).toEqual([])
    expect(response3.body.showcases[0].completionMessage).toBeDefined()

    // Test 4: Get all with all expands including asset content
    const response4 = await request
      .get(
        `/showcases?expand=${ShowcaseExpand.Scenarios}&expand=${ShowcaseExpand.CredentialDefinitions}&expand=${ShowcaseExpand.Personas}&expand=${ShowcaseExpand.AssetContent}`,
      )
      .expect(200)
    expect(response4.body.showcases.length).toBeGreaterThanOrEqual(2)
    expect(response4.body.showcases[0].scenarios.length).toBeGreaterThanOrEqual(1)
    expect(response4.body.showcases[0].credentialDefinitions.length).toBeGreaterThanOrEqual(1)
    expect(response4.body.showcases[0].personas.length).toBeGreaterThanOrEqual(1)
    expect(response4.body.showcases[0].completionMessage).toBeDefined()

    // Check if at least one showcase has a banner image with content
    const showcaseWithBanner = response4.body.showcases.find((showcase: Showcase) => showcase.bannerImage && typeof showcase.bannerImage === 'object')
    if (showcaseWithBanner) {
      expect(showcaseWithBanner.bannerImage).toHaveProperty('id')
      expect(showcaseWithBanner.bannerImage).toHaveProperty('content')
    }
  })

  it('should throw an error for invalid expand parameters', async () => {
    const { asset, scenario, credentialDefinition, persona } = await createTestPrerequisites()
    const showcaseRequest: ShowcaseRequest = {
      name: 'Mixed Expand Test',
      description: 'Testing mixed valid and invalid expand parameters',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      credentialDefinitions: [credentialDefinition.id],
      personas: [persona.id],
      bannerImage: asset.id,
      completionMessage: 'Test completion message',
    }

    const createResponse = await request.post('/showcases').send(showcaseRequest).expect(201)
    const createdShowcase = createResponse.body.showcase

    // Should now expect a 400 Bad Request error when using invalid expand parameter
    await request
      .get(`/showcases/${createdShowcase.slug}?expand=${ShowcaseExpand.Scenarios}&expand=invalidExpand&expand=${ShowcaseExpand.Personas}`)
      .expect(400)

    // Test with only valid expand parameters
    const validResponse = await request
      .get(`/showcases/${createdShowcase.slug}?expand=${ShowcaseExpand.Scenarios}&expand=${ShowcaseExpand.Personas}`)
      .expect(200)

    // Verify valid expands are processed correctly
    expect(validResponse.body.showcase.scenarios.length).toEqual(1)
    expect(validResponse.body.showcase.personas.length).toEqual(1)
    expect(validResponse.body.showcase.credentialDefinitions).toEqual([])
    expect(validResponse.body.showcase.completionMessage).toEqual('Test completion message')
  })
})
