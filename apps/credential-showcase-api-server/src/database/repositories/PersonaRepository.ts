import { eq } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import AssetRepository from './AssetRepository'
import { NotFoundError } from '../../errors'
import { personas } from '../schema'
import { Persona, NewPersona, RepositoryDefinition } from '../../types'

@Service()
class PersonaRepository implements RepositoryDefinition<Persona, NewPersona> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetRepository: AssetRepository,
  ) {}

  async create(persona: NewPersona): Promise<Persona> {
    const headshotImageResult = persona.headshotImage ? await this.assetRepository.findById(persona.headshotImage) : null
    const bodyImageResult = persona.bodyImage ? await this.assetRepository.findById(persona.bodyImage) : null

    const [result] = await (
      await this.databaseService.getConnection()
    )
      .insert(personas)
      .values({
        ...persona,
        headshotImage: headshotImageResult ? headshotImageResult.id : null,
        bodyImage: bodyImageResult ? bodyImageResult.id : null,
      })
      .returning()

    return {
      ...result,
      bodyImage: bodyImageResult,
      headshotImage: headshotImageResult,
    }
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(personas).where(eq(personas.id, id))
  }

  async update(id: string, persona: NewPersona): Promise<Persona> {
    await this.findById(id)
    const headshotImageResult = persona.headshotImage ? await this.assetRepository.findById(persona.headshotImage) : null
    const bodyImageResult = persona.bodyImage ? await this.assetRepository.findById(persona.bodyImage) : null

    const [result] = await (
      await this.databaseService.getConnection()
    )
      .update(personas)
      .set({
        ...persona,
        headshotImage: headshotImageResult ? headshotImageResult.id : null,
        bodyImage: bodyImageResult ? bodyImageResult.id : null,
      })
      .where(eq(personas.id, id))
      .returning()

    return {
      ...result,
      bodyImage: bodyImageResult,
      headshotImage: headshotImageResult,
    }
  }

  async findById(id: string): Promise<Persona> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.personas.findFirst({
      where: eq(personas.id, id),
      with: {
        headshotImage: true,
        bodyImage: true,
      },
    })

    if (!result) {
      throw new NotFoundError(`No persona found for id: ${id}`)
    }

    return result
  }

  async findAll(): Promise<Persona[]> {
    return (await this.databaseService.getConnection()).query.personas.findMany({
      with: {
        headshotImage: true,
        bodyImage: true,
      },
    })
  }
}

export default PersonaRepository
