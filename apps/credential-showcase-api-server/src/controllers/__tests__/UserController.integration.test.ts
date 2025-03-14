import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { Application } from 'express'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'
import supertest = require('supertest')
import UserRepository from '../../database/repositories/UserRepository'
import UserService from '../../services/UserService'
import UserController from '../UserController'

describe('UserController Integration Tests', () => {
  let app: Application
  let request: any
  let client: PGlite

  beforeAll(async () => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/credential-showcase-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.get(UserRepository)
    Container.get(UserService)
    app = createExpressServer({
      controllers: [UserController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    Container.reset()
    await client.close()
  })

  it('should create, retrieve, update, and delete an user', async () => {
    const createResponse = await request
      .post('/users')
      .send({
        identifierType: 'DID',
        identifier: 'did:example.com',
      })
      .expect(201)
    const created = createResponse.body.user
    expect(created).toHaveProperty('id')
    expect(created.identifierType).toEqual('DID')
    expect(created.identifier).toEqual('did:example.com')

    const getResponse = await request.get(`/users/${created.id}`).expect(200)
    expect(getResponse.body.user.identifierType).toEqual('DID')
    expect(getResponse.body.user.identifier).toEqual('did:example.com')

    const allResponse = await request.get('/users').expect(200)
    expect(Array.isArray(allResponse.body.users)).toBe(true)
    expect(allResponse.body.users.length).toBeGreaterThanOrEqual(1)

    const updateResponse = await request
      .put(`/users/${created.id}`)
      .send({
        identifierType: 'DID',
        identifier: 'did:example.org',
      })
      .expect(200)
    expect(updateResponse.body.user.identifierType).toEqual('DID')
    expect(updateResponse.body.user.identifier).toEqual('did:example:org')

    await request.delete(`/users/${created.id}`).expect(204)
    await request.get(`/users/${created.id}`).expect(404)
  })
})
