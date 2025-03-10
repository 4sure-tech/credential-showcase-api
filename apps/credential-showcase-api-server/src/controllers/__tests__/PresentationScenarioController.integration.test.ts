import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import PresentationScenarioController from '../PresentationScenarioController'
import { Application } from 'express'
import { CredentialAttributeType, CredentialType, IdentifierType, RelyingPartyType, ScenarioType, StepActionType, StepType } from '../../types'
import { PresentationScenarioRequest, StepRequest } from 'credential-showcase-openapi'
import AssetRepository from '../../database/repositories/AssetRepository'
import { CredentialSchemaRepository } from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import RelyingPartyRepository from '../../database/repositories/RelyingPartyRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ScenarioService from '../../services/ScenarioService'
import testDbContainer from './testDbContainer'
import supertest = require('supertest')

let app: Application
let request: any

describe('PresentationScenarioController Integration Tests', () => {
  beforeAll(async () => {
    await testDbContainer.start()

    useContainer(Container)

    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(RelyingPartyRepository)
    Container.get(ScenarioRepository)
    Container.get(ScenarioService)

    app = createExpressServer({
      controllers: [PresentationScenarioController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await testDbContainer.stop()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a presentation scenario with steps and actions', async () => {
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
        { name: 'example_attribute_name1', value: 'example_attribute_value1', type: CredentialAttributeType.STRING },
        { name: 'example_attribute_name2', value: 'example_attribute_value2', type: CredentialAttributeType.STRING },
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

    const relyingPartyRepository = Container.get(RelyingPartyRepository)
    const relyingParty = await relyingPartyRepository.create({
      name: 'Test Relying Party',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      description: 'Test relying party description',
      organization: 'Test Organization',
      logo: asset.id,
    })

    const personaRepository = Container.get(PersonaRepository)
    const newPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }
    const persona = await personaRepository.create(newPersona)

    // Provide an initial step to satisfy the "at least one step" requirement.
    const initialStep: StepRequest = {
      title: 'Initial Step',
      description: 'Initial step description',
      order: 1,
      type: StepType.HUMAN_TASK,
      asset: asset.id,
      actions: [
        {
          title: 'Initial Action',
          actionType: StepActionType.ARIES_OOB,
          text: 'Initial action text',
        },
      ],
    }

    const scenarioRequest: PresentationScenarioRequest = {
      name: 'Test Presentation Scenario',
      description: 'Test scenario description',
      steps: [initialStep],
      personas: [persona.id],
      relyingParty: relyingParty.id,
      hidden: false,
    }

    const createResponse = await request.post('/scenarios/presentations').send(scenarioRequest).expect(201)
    const createdScenario = createResponse.body.presentationScenario
    expect(createdScenario).toHaveProperty('id')
    expect(createdScenario.name).toEqual('Test Presentation Scenario')
    expect(createdScenario.type).toEqual(ScenarioType.PRESENTATION)
    expect(createdScenario.relyingParty.id).toEqual(relyingParty.id)

    // 2. Retrieve all presentation scenarios
    const getAllResponse = await request.get('/scenarios/presentations').expect(200)
    expect(getAllResponse.body.presentationScenarios).toBeInstanceOf(Array)
    expect(getAllResponse.body.presentationScenarios.length).toBe(1)

    // 3. Retrieve the created scenario
    const getResponse = await request.get(`/scenarios/presentations/${createdScenario.id}`).expect(200)
    expect(getResponse.body.presentationScenario.name).toEqual('Test Presentation Scenario')

    // 4. Update the scenario
    const updateResponse = await request
      .put(`/scenarios/presentations/${createdScenario.id}`)
      .send({
        ...scenarioRequest,
        name: 'Updated Presentation Scenario Name',
      })
      .expect(200)
    expect(updateResponse.body.presentationScenario.name).toEqual('Updated Presentation Scenario Name')

    // 5. Create a step for the scenario
    const stepRequest: StepRequest = {
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
        },
      ],
    }

    const createStepResponse = await request.post(`/scenarios/presentations/${createdScenario.id}/steps`).send(stepRequest).expect(201)
    const createdStep = createStepResponse.body.step
    expect(createdStep).toHaveProperty('id')
    expect(createdStep.title).toEqual('Test Step')

    // 6. Retrieve all steps for the scenario
    const getAllStepsResponse = await request.get(`/scenarios/presentations/${createdScenario.id}/steps`).expect(200)
    expect(getAllStepsResponse.body.steps).toBeInstanceOf(Array)
    expect(getAllStepsResponse.body.steps.length).toBe(1)

    // 7. Retrieve the created step
    const getStepResponse = await request.get(`/scenarios/presentations/${createdScenario.id}/steps/${createdStep.id}`).expect(200)
    expect(getStepResponse.body.step.title).toEqual('Test Step')

    // 8. Update the step
    const updateStepResponse = await request
      .put(`/scenarios/presentations/${createdScenario.id}/steps/${createdStep.id}`)
      .send({
        ...stepRequest,
        title: 'Updated Test Step',
      })
      .expect(200)
    expect(updateStepResponse.body.step.title).toEqual('Updated Test Step')

    // 9. Delete the step
    await request.delete(`/scenarios/presentations/${createdScenario.id}/steps/${createdStep.id}`).expect(204)

    // 10. Delete the presentation scenario
    await request.delete(`/scenarios/presentations/${createdScenario.id}`).expect(204)
  })
})
