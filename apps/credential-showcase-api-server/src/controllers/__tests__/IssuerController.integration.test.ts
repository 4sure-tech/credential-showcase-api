import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import IssuerController from '../IssuerController'
import IssuerService from '../../services/IssuerService'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import { CredentialSchemaRepository } from '../../database/repositories/CredentialSchemaRepository'
import { Application } from 'express'
import { CredentialAttributeType, CredentialType, IdentifierType } from '../../types'
import { IssuerRequest } from 'credential-showcase-openapi'
import testDbContainer from './testDbContainer'
import supertest = require('supertest')

let app: Application
let request: any

describe('IssuerController Integration Tests', () => {
  beforeAll(async () => {
    await testDbContainer.start()

    useContainer(Container)

    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(IssuerRepository)
    Container.get(IssuerService)

    // Create Express server using routing-controllers
    app = createExpressServer({
      controllers: [IssuerController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await testDbContainer.stop()
    Container.reset()
  })

  it('should create, retrieve, update, and delete an issuer', async () => {
    // Create prerequisites: an asset, credential schema, and credential definition
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

    // Create an issuer
    const createResponse = await request
      .post('/roles/issuers')
      .send({
        name: 'Test Issuer',
        description: 'Test Issuer Description',
        type: 'ARIES',
        identifierType: 'DID',
        identifier: 'did:test:456',
        organization: 'Test Organization',
        logo: asset.id,
        credentialDefinitions: [credentialDefinition.id],
        credentialSchemas: [credentialSchema.id],
      } satisfies IssuerRequest)
      .expect(201)

    const created = createResponse.body.issuer
    expect(created).toHaveProperty('id')
    expect(created.name).toEqual('Test Issuer')
    expect(created.description).toEqual('Test Issuer Description')
    expect(created.type).toEqual('ARIES')

    // Retrieve all issuers
    const getAllResponse = await request.get('/roles/issuers').expect(200)
    expect(getAllResponse.body.issuers).toBeInstanceOf(Array)
    expect(getAllResponse.body.issuers.length).toBeGreaterThan(0)

    // Retrieve the created issuer
    const getResponse = await request.get(`/roles/issuers/${created.id}`).expect(200)
    expect(getResponse.body.issuer.name).toEqual('Test Issuer')
    expect(getResponse.body.issuer.organization).toEqual('Test Organization')

    // Update the issuer
    const updateResponse = await request
      .put(`/roles/issuers/${created.id}`)
      .send({
        name: 'Updated Issuer',
        description: 'Updated Description',
        type: 'ARIES',
        organization: 'Updated Organization',
        logo: asset.id,
        credentialDefinitions: [credentialDefinition.id],
        credentialSchemas: [credentialSchema.id],
      } satisfies IssuerRequest)
      .expect(200)

    expect(updateResponse.body.issuer.name).toEqual('Updated Issuer')
    expect(updateResponse.body.issuer.description).toEqual('Updated Description')
    expect(updateResponse.body.issuer.organization).toEqual('Updated Organization')

    // Delete the issuer
    await request.delete(`/roles/issuers/${created.id}`).expect(204)

    // Verify deletion (should return 404)
    await request.get(`/roles/issuers/${created.id}`).expect(404)
  })
})
