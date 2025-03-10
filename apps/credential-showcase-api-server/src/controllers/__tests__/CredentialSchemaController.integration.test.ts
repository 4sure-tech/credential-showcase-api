import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { CredentialSchemaController } from '../CredentialSchemaController'
import { Application } from 'express'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { CredentialAttributeType, CredentialSchemaRequest } from 'credential-showcase-openapi'
import supertest = require('supertest')

let app: Application
let request: any
let container: StartedPostgreSqlContainer

describe('CredentialSchemaController Integration Tests', () => {
  beforeAll(async () => {
    // Start a new Postgres container
    container = await new PostgreSqlContainer().start()

    // Set the connection URL environment variable for your DatabaseService
    process.env.DB_URL = container.getConnectionUri()
    process.env.DB_USERNAME = 'postgres'
    process.env.DB_PASSWORD = 'postgres'
    process.env.DB_HOST = container.getHost()
    process.env.DB_PORT = container.getMappedPort(5432).toString()
    process.env.DB_NAME = 'postgres'

    useContainer(Container)

    app = createExpressServer({
      controllers: [CredentialSchemaController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
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
