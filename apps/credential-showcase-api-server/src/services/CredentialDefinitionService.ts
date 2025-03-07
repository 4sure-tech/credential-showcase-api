import { Service } from 'typedi'
import CredentialDefinitionRepository from '../database/repositories/CredentialDefinitionRepository'
import { CredentialDefinition, NewCredentialDefinition } from '../types'

@Service()
class CredentialDefinitionService {
  constructor(private readonly credentialDefinitionRepository: CredentialDefinitionRepository) {}

  public getCredentialDefinitions = async (): Promise<CredentialDefinition[]> => {
    return this.credentialDefinitionRepository.findAll()
  }

  public getCredentialDefinition = async (id: string): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.findById(id)
  }

  public createCredentialDefinition = async (credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.create(credentialDefinition)
  }

  public updateCredentialDefinition = async (id: string, credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.update(id, credentialDefinition)
  }

  public deleteCredentialDefinition = async (id: string): Promise<void> => {
    return this.credentialDefinitionRepository.delete(id)
  }
}

export default CredentialDefinitionService
