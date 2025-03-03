import { eq } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import { NotFoundError } from '../../errors'
import { credentialAttributes, credentialSchemas } from '../schema'
import { CredentialSchema, NewCredentialAttribute, NewCredentialSchema, RepositoryDefinition } from '../../types'

@Service()
export class CredentialSchemaRepository implements RepositoryDefinition<CredentialSchema, NewCredentialSchema> {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(credentialSchema: NewCredentialSchema): Promise<CredentialSchema> {
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialSchema> => {
      const [credentialSchemaResult] = await tx
        .insert(credentialSchemas)
        .values({
          extId: credentialSchema.extId,
          name: credentialSchema.name,
          version: credentialSchema.version,
          issuerId: credentialSchema.issuerId,
        })
        .returning()

      const credentialAttributesResult = await tx
        .insert(credentialAttributes)
        .values(
          credentialSchema.attributes.map((attribute: NewCredentialAttribute) => ({
            ...attribute,
            credentialSchema: credentialSchemaResult.id,
          })),
        )
        .returning()

      return {
        ...credentialSchemaResult,
        attributes: credentialAttributesResult,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(credentialSchemas).where(eq(credentialSchemas.id, id))
  }

  async update(id: string, credentialSchema: NewCredentialSchema): Promise<CredentialSchema> {
    await this.findById(id)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialSchema> => {
      const [credentialSchemaResult] = await tx
        .update(credentialSchemas)
        .set({
          extId: credentialSchemas.extId,
          name: credentialSchema.name,
          version: credentialSchema.version,
          issuerId: credentialSchema.issuerId,
        })
        .where(eq(credentialSchemas.id, id))
        .returning()

      await tx.delete(credentialAttributes).where(eq(credentialAttributes.credentialSchema, id))

      const credentialAttributesResult = await tx
        .insert(credentialAttributes)
        .values(
          credentialSchema.attributes.map((attribute: NewCredentialAttribute) => ({
            ...attribute,
            credentialSchema: credentialSchemaResult.id,
          })),
        )
        .returning()

      return {
        ...credentialSchemaResult,
        attributes: credentialAttributesResult,
      }
    })
  }

  async findById(id: string): Promise<CredentialSchema> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialSchemas.findFirst({
      where: eq(credentialSchemas.id, id),
      with: {
        attributes: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential schema found for id: ${id}`))
    }

    return result
  }

  async findByExtId(extId: string): Promise<CredentialSchema> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialSchemas.findFirst({
      where: eq(credentialSchemas.extId, extId),
      with: {
        attributes: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential schema found for extId: ${identextIdifier}`))
    }

    return result
  }

  async findAll(): Promise<CredentialSchema[]> {
    return (await this.databaseService.getConnection()).query.credentialSchemas.findMany({
      with: {
        attributes: true,
      },
    })
  }
}
