import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { CredentialSchemaController } from '../CredentialSchemaController'
import { Application } from 'express'
import { CredentialAttributeType, CredentialSchemaRequest } from 'credential-showcase-openapi'
import testDbContainer from './testDbContainer'
import supertest = require('supertest')

let app: Application
let request: any

describe('CredentialSchemaController Integration Tests', () => {
  beforeAll(async () => {
    await testDbContainer.start()

    useContainer(Container)

    app = createExpressServer({
      controllers: [CredentialSchemaController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await testDbContainer.stop()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a credential schema', async () => {
    // Create a credential schema
    const createResponse = await request
      .post('/credentials/schemas')
      .send({
        name: 'Test Schema',
        version: '1.0',
        identifierType: 'DID',
        identifier: 'did:test:456',
        attributes: [{ name: 'attr1', value: 'value1', type: CredentialAttributeType.String }],
      } satisfies CredentialSchemaRequest)
      .expect(201)
    const created = createResponse.body.credentialSchema
    expect(created).toHaveProperty('id')

    // Retrieve the created schema
    const getResponse = await request.get(`/credentials/schemas/${created.id}`).expect(200)
    expect(getResponse.body.credentialSchema.name).toEqual('Test Schema')

    // Update the credential schema
    const updateResponse = await request
      .put(`/credentials/schemas/${created.id}`)
      .send({
        name: 'Updated Schema',
        version: '1.0',
        identifierType: 'DID',
        identifier: 'did:test:456',
        attributes: [{ name: 'attr1', value: 'value1', type: CredentialAttributeType.String }],
      } satisfies CredentialSchemaRequest)
      .expect(200)
    expect(updateResponse.body.credentialSchema.name).toEqual('Updated Schema')

    // Delete the credential schema
    await request.delete(`/credentials/schemas/${created.id}`).expect(204)

    // Verify deletion (assuming a 404 is returned when not found)
    await request.get(`/credentials/schemas/${created.id}`).expect(404)
  })
})
