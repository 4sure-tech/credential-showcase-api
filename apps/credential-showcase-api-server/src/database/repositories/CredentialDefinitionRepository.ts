import { eq } from 'drizzle-orm';
import { Service } from 'typedi';
import DatabaseService from '../../services/DatabaseService';
import AssetRepository from './AssetRepository';
import { NotFoundError } from '../../errors';
import { credentialAttributes, credentialDefinitions, credentialRepresentations, revocationInfo } from '../schema';
import {
    CredentialDefinition,
    NewCredentialAttribute,
    NewCredentialDefinition,
    // NewCredentialRepresentation, TODO SHOWCASE-81 enable
    RepositoryDefinition
} from '../../types';

@Service()
class CredentialDefinitionRepository implements RepositoryDefinition<CredentialDefinition, NewCredentialDefinition> {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly assetRepository: AssetRepository
    ) {}

    async create(credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
        const iconResult = await this.assetRepository.findById(credentialDefinition.icon)

        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
            const [credentialDefinitionResult] = await tx.insert(credentialDefinitions)
                .values({
                    ...credentialDefinition,
                })
                .returning();

            const credentialAttributesResult = await tx.insert(credentialAttributes)
                    .values(credentialDefinition.attributes.map((attribute: NewCredentialAttribute) => ({
                        ...attribute,
                        credentialDefinition: credentialDefinitionResult.id
                    })))
                .returning();

            // TODO SHOWCASE-81 enable
            // const credentialRepresentationsResult = await tx.insert(credentialRepresentations)
            //     .values(credentialDefinition.representations.map((representation: NewCredentialRepresentation) => ({
            //         ...representation,
            //         credentialDefinition: credentialDefinitionResult.id
            //     })))
            //     .returning();

            // TODO SHOWCASE-80 enable
            let revocationResult = null;
            // if (credentialDefinition.revocation) {
            //     [revocationResult] = await tx.insert(revocationInfo)
            //         .values({
            //             ...credentialDefinition.revocation,
            //             credentialDefinition: credentialDefinitionResult.id
            //         })
            //         .returning();
            // }

            return {
                ...credentialDefinitionResult,
                icon: iconResult,
                attributes: credentialAttributesResult,
                representations: [], //credentialRepresentationsResult, TODO SHOWCASE-81 enable
                revocation: revocationResult,
            };
        })
    }

    async delete(id: string): Promise<void> {
        await this.findById(id)
        await (await this.databaseService.getConnection())
            .delete(credentialDefinitions)
            .where(eq(credentialDefinitions.id, id))
    }

    async update(id: string, credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
        await this.findById(id)

        const iconResult = await this.assetRepository.findById(credentialDefinition.icon)
        return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
            const [credentialDefinitionResult] = await tx.update(credentialDefinitions)
                .set({
                    ...credentialDefinition
                })
                .where(eq(credentialDefinitions.id, id))
                .returning();

            await tx.delete(credentialAttributes).where(eq(credentialAttributes.credentialDefinition, id))
            await tx.delete(credentialRepresentations).where(eq(credentialRepresentations.credentialDefinition, id))
            await tx.delete(revocationInfo).where(eq(revocationInfo.credentialDefinition, id))

            const credentialAttributesResult = await tx.insert(credentialAttributes)
                .values(credentialDefinition.attributes.map((attribute: NewCredentialAttribute) => ({
                    ...attribute,
                    credentialDefinition: credentialDefinitionResult.id
                })))
                .returning();

            // TODO SHOWCASE-81 enable
            // const credentialRepresentationsResult = await tx.insert(credentialRepresentations)
            //     .values(credentialDefinition.representations.map((representation: NewCredentialRepresentation) => ({
            //         ...representation,
            //         credentialDefinition: credentialDefinitionResult.id
            //     })))
            //     .returning();

            // TODO SHOWCASE-80 enable
            let revocationResult = null;
            // if (credentialDefinition.revocation) {
            //     [revocationResult] = await tx.insert(revocationInfo)
            //         .values({
            //             ...credentialDefinition.revocation,
            //             credentialDefinition: credentialDefinitionResult.id
            //         })
            //         .returning();
            // }

            return {
                ...credentialDefinitionResult,
                icon: iconResult,
                attributes: credentialAttributesResult,
                representations: [],//credentialRepresentationsResult, TODO SHOWCASE-81 enable
                revocation: revocationResult,
            };
        })
    }

    async findById(id: string): Promise<CredentialDefinition> {
        const result = await (await this.databaseService.getConnection()).query.credentialDefinitions.findFirst({
            where: eq(credentialDefinitions.id, id),
            with: {
                icon: true,
                attributes: true,
                representations: true,
                revocation: true
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
                revocation: true
            },
        });
    }
}

export default CredentialDefinitionRepository
