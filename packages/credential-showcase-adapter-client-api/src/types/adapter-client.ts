import { CredentialDefinition } from 'credential-showcase-openapi'

export interface IAdapterClientApi {
  storeCredentialDefinition(credentialDefinition: CredentialDefinition): Promise<void>

  close(): Promise<void>
}
