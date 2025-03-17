import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Container } from 'typedi'
import DatabaseService from '../../../services/DatabaseService'
import AssetRepository from '../AssetRepository'
import PersonaRepository from '../PersonaRepository'
import * as schema from '../../schema'
import { Asset, NewAsset, NewPersona } from '../../../types'

describe('Database persona repository tests', (): void => {
  let client: PGlite
  let personaRepository: PersonaRepository
  let asset: Asset

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/credential-showcase-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    personaRepository = Container.get(PersonaRepository)
    const assetRepository = Container.get(AssetRepository)
    const newAsset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }
    asset = await assetRepository.create(newAsset)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save persona to database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: true,
    }

    const savedPersona = await personaRepository.create(persona)

    expect(savedPersona).toBeDefined()
    expect(savedPersona.name).toEqual(persona.name)
    expect(savedPersona.slug).toEqual('john-doe')
    expect(savedPersona.role).toEqual(persona.role)
    expect(savedPersona.description).toEqual(persona.description)
    expect(savedPersona.hidden).toEqual(persona.hidden)
    const hsAsset = savedPersona.headshotImage as Asset
    expect(hsAsset).toBeDefined()
    expect(hsAsset!.id).toBeDefined()
    expect(hsAsset!.mediaType).toEqual(asset.mediaType)
    expect(hsAsset!.fileName).toEqual(asset.fileName)
    expect(hsAsset!.description).toEqual(asset.description)
    expect(hsAsset!.content).toStrictEqual(asset.content)
    const biAsset = savedPersona.bodyImage as Asset
    expect(biAsset).toBeDefined()
    expect(biAsset!.id).toBeDefined()
    expect(biAsset!.mediaType).toEqual(asset.mediaType)
    expect(biAsset!.fileName).toEqual(asset.fileName)
    expect(biAsset!.description).toEqual(asset.description)
    expect(biAsset!.content).toStrictEqual(asset.content)
  })

  it('Should save persona without images to database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)

    expect(savedPersona).toBeDefined()
    expect(savedPersona.name).toEqual(persona.name)
    expect(savedPersona.role).toEqual(persona.role)
    expect(savedPersona.description).toEqual(persona.description)
    expect(savedPersona.headshotImage).toBeNull()
    expect(savedPersona.bodyImage).toBeNull()
  })

  it('Should throw error when saving persona with invalid headshot image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: unknownImageId,
      hidden: false,
    }

    await expect(personaRepository.create(persona)).rejects.toThrowError(`No asset found for id: ${unknownImageId}`)
  })

  it('Should throw error when saving persona with invalid body image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      bodyImage: unknownImageId,
      hidden: false,
    }

    await expect(personaRepository.create(persona)).rejects.toThrowError(`No asset found for id: ${unknownImageId}`)
  })

  it('Should get persona by id from database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const fromDb = await personaRepository.findById(savedPersona.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(persona.name)
    expect(fromDb.role).toEqual(persona.role)
    expect(fromDb.description).toEqual(persona.description)
    const hsAsset = fromDb.headshotImage as Asset
    expect(hsAsset).toBeDefined()
    expect(hsAsset!.id).toBeDefined()
    expect(hsAsset!.mediaType).toEqual(asset.mediaType)
    expect(hsAsset!.fileName).toEqual(asset.fileName)
    expect(hsAsset!.description).toEqual(asset.description)
    expect(hsAsset!.content).toStrictEqual(asset.content)
    const biAsset = fromDb.bodyImage as Asset
    expect(biAsset).toBeDefined()
    expect(biAsset!.id).toBeDefined()
    expect(biAsset!.mediaType).toEqual(asset.mediaType)
    expect(biAsset!.fileName).toEqual(asset.fileName)
    expect(biAsset!.description).toEqual(asset.description)
    expect(biAsset!.content).toStrictEqual(asset.content)
  })

  it('Should get all personas from database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona1 = await personaRepository.create(persona)
    expect(savedPersona1).toBeDefined()

    const savedPersona2 = await personaRepository.create(persona)
    expect(savedPersona2).toBeDefined()

    const fromDb = await personaRepository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete persona from database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    await personaRepository.delete(savedPersona.id)

    await expect(personaRepository.findById(savedPersona.id)).rejects.toThrowError(`No persona found for id: ${savedPersona.id}`)
  })

  it('Should update persona in database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: true,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const newName = 'Jane Doe'
    const updatedPersona = await personaRepository.update(savedPersona.id, {
      ...savedPersona,
      headshotImage: (savedPersona.headshotImage as Asset)!.id,
      bodyImage: (savedPersona.bodyImage as Asset)!.id,
      name: newName,
    })

    expect(updatedPersona).toBeDefined()
    expect(updatedPersona.name).toEqual(newName)
    expect(updatedPersona.slug).toEqual('jane-doe')
    expect(updatedPersona.role).toEqual(persona.role)
    expect(updatedPersona.description).toEqual(persona.description)
    expect(updatedPersona.hidden).toEqual(persona.hidden)
    const hsAsset = updatedPersona.headshotImage as Asset
    expect(hsAsset).toBeDefined()
    expect(hsAsset!.id).toBeDefined()
    expect(hsAsset!.mediaType).toEqual(asset.mediaType)
    expect(hsAsset!.fileName).toEqual(asset.fileName)
    expect(hsAsset!.description).toEqual(asset.description)
    expect(hsAsset!.content).toStrictEqual(asset.content)
    const biAsset = updatedPersona.bodyImage as Asset
    expect(biAsset).toBeDefined()
    expect(biAsset!.id).toBeDefined()
    expect(biAsset!.mediaType).toEqual(asset.mediaType)
    expect(biAsset!.fileName).toEqual(asset.fileName)
    expect(biAsset!.description).toEqual(asset.description)
    expect(biAsset!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when updating persona with invalid headshot image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const updatedPersona: NewPersona = {
      ...savedPersona,
      headshotImage: unknownImageId,
      bodyImage: (savedPersona.bodyImage as Asset)!.id,
    }

    await expect(personaRepository.update(savedPersona.id, updatedPersona)).rejects.toThrowError(`No asset found for id: ${unknownImageId}`)
  })

  it('Should throw error when updating persona with invalid body image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const updatedPersona: NewPersona = {
      ...savedPersona,
      headshotImage: (savedPersona.headshotImage as Asset).id,
      bodyImage: unknownImageId,
    }

    await expect(personaRepository.update(savedPersona.id, updatedPersona)).rejects.toThrowError(`No asset found for id: ${unknownImageId}`)
  })
})
