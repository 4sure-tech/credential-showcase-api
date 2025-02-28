import { eq } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import AssetRepository from './AssetRepository'
import { NotFoundError } from '../../errors'
import { credentialDefinitions, credentialRepresentations, revocationInfo } from '../schema'
import { CredentialDefinition, NewCredentialDefinition, NewCredentialRepresentation, RepositoryDefinition } from '../../types'

@Service()
class CredentialDefinitionRepository implements RepositoryDefinition<CredentialDefinition, NewCredentialDefinition> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetRepository: AssetRepository,
  ) {}

  async create(credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
    const iconResult = await this.assetRepository.findById(credentialDefinition.icon)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
      const [credentialDefinitionResult] = await tx
        .insert(credentialDefinitions)
        .values({
          name: credentialDefinition.name,
          version: credentialDefinition.version,
          icon: iconResult.id,
          type: credentialDefinition.type,
        })
        .returning()

      const credentialRepresentationsResult = await tx
        .insert(credentialRepresentations)
        .values(
          credentialDefinition.representations.map((representation: NewCredentialRepresentation) => ({
            ...representation,
            credentialDefinition: credentialDefinitionResult.id,
          })),
        )
        .returning()

      let revocationResult = null
      if (credentialDefinition.revocation) {
        ;[revocationResult] = await tx
          .insert(revocationInfo)
          .values({
            ...credentialDefinition.revocation,
            credentialDefinition: credentialDefinitionResult.id,
          })
          .returning()
      }

      return {
        ...credentialDefinitionResult,
        icon: iconResult,
        representations: credentialRepresentationsResult,
        revocation: revocationResult,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(credentialDefinitions).where(eq(credentialDefinitions.id, id))
  }

  async update(id: string, credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
    await this.findById(id)

    const iconResult = await this.assetRepository.findById(credentialDefinition.icon)
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
      const [credentialDefinitionResult] = await tx
        .update(credentialDefinitions)
        .set({
          name: credentialDefinition.name,
          type: credentialDefinition.type,
          version: credentialDefinition.version,
          icon: credentialDefinition.icon,
        })
        .where(eq(credentialDefinitions.id, id))
        .returning()

      await tx.delete(credentialRepresentations).where(eq(credentialRepresentations.credentialDefinition, id))
      await tx.delete(revocationInfo).where(eq(revocationInfo.credentialDefinition, id))

      const credentialRepresentationsResult = await tx
        .insert(credentialRepresentations)
        .values(
          credentialDefinition.representations.map((representation: NewCredentialRepresentation) => ({
            ...representation,
            credentialDefinition: credentialDefinitionResult.id,
          })),
        )
        .returning()

      let revocationResult = null
      if (credentialDefinition.revocation) {
        ;[revocationResult] = await tx
          .insert(revocationInfo)
          .values({
            ...credentialDefinition.revocation,
            credentialDefinition: credentialDefinitionResult.id,
          })
          .returning()
      }

      return {
        ...credentialDefinitionResult,
        icon: iconResult,
        representations: credentialRepresentationsResult,
        revocation: revocationResult,
      }
    })
  }

  async findById(id: string): Promise<CredentialDefinition> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialDefinitions.findFirst({
      where: eq(credentialDefinitions.id, id),
      with: {
        icon: true,
        attributes: true,
        representations: true,
        revocation: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential definition found for id: ${id}`))
    }

    return result
  }

  async findAll(): Promise<CredentialDefinition[]> {
    return (await this.databaseService.getConnection()).query.credentialDefinitions.findMany({
      with: {
        icon: true,
        attributes: true,
        representations: true,
        revocation: true,
      },
    })
  }
}

export default CredentialDefinitionRepository
