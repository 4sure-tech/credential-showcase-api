import {
  Asset as AssetDTO,
  CredentialDefinition as CredentialDefinitionDTO,
  RelyingParty as RelyingPartyDTO,
  Issuer as IssuerDTO,
  IssuanceFlow as IssuanceFlowDTO,
  PresentationFlow as PresentationFlowDTO,
  Step as StepDTO,
  Persona as PersonaDTO,
  AssetRequest,
} from 'credential-showcase-openapi'
import { Asset, NewAsset, CredentialDefinition, RelyingParty, Issuer, IssuanceFlow, PresentationFlow, Step, WorkflowType, Persona } from '../types'

export const newAssetFrom = (asset: AssetRequest): NewAsset => {
  return {
    ...asset,
    content: Buffer.from(asset.content),
  }
}

export const assetDTOFrom = (asset: Asset): AssetDTO => {
  return {
    ...asset,
    fileName: asset.fileName ? asset.fileName : undefined,
    description: asset.description ? asset.description : undefined,
    content: asset.content.toString(),
  }
}

export const credentialDefinitionDTOFrom = (credentialDefinition: CredentialDefinition): CredentialDefinitionDTO => {
  return {
    ...credentialDefinition,
    revocation: credentialDefinition.revocation ? credentialDefinition.revocation : undefined,
    icon: assetDTOFrom(credentialDefinition.icon),
  }
}

export const relyingPartyDTOFrom = (relyingParty: RelyingParty): RelyingPartyDTO => {
  return {
    ...relyingParty,
    organization: relyingParty.organization ? relyingParty.organization : undefined,
    logo: relyingParty.logo ? assetDTOFrom(relyingParty.logo) : undefined,
    credentialDefinitions: relyingParty.credentialDefinitions.map((credentialDefinition) => credentialDefinitionDTOFrom(credentialDefinition)),
  }
}

export const issuerDTOFrom = (issuer: Issuer): IssuerDTO => {
  return {
    ...issuer,
    organization: issuer.organization ? issuer.organization : undefined,
    logo: issuer.logo ? assetDTOFrom(issuer.logo) : undefined,
    credentialDefinitions: issuer.credentialDefinitions.map((credentialDefinition) => credentialDefinitionDTOFrom(credentialDefinition)),
  }
}

export const issuanceFlowDTOFrom = (issuanceFlow: IssuanceFlow): IssuanceFlowDTO => {
  if (!issuanceFlow.issuer) {
    throw Error('Missing issuer in issuance flow')
  }

  return {
    ...issuanceFlow,
    issuer: issuerDTOFrom(issuanceFlow.issuer),
    type: WorkflowType.ISSUANCE,
    steps: issuanceFlow.steps.map((step) => stepDTOFrom(step)),
    personas: issuanceFlow.personas.map((persona) => personaDTOFrom(persona)),
  }
}

export const presentationFlowDTOFrom = (presentationFlow: PresentationFlow): PresentationFlowDTO => {
  if (!presentationFlow.relyingParty) {
    throw Error('Missing relying party in presentation flow')
  }

  return {
    ...presentationFlow,
    relyingParty: relyingPartyDTOFrom(presentationFlow.relyingParty),
    type: WorkflowType.PRESENTATION,
    steps: presentationFlow.steps.map((step) => stepDTOFrom(step)),
    personas: presentationFlow.personas.map((persona) => personaDTOFrom(persona)),
  }
}

export const stepDTOFrom = (step: Step): StepDTO => {
  return {
    ...step,
    asset: step.asset ? assetDTOFrom(step.asset) : undefined,
    subFlow: step.subFlow ? step.subFlow : undefined,
  }
}

export const personaDTOFrom = (persona: Persona): PersonaDTO => {
  return {
    ...persona,
    headshotImage: persona.headshotImage ? assetDTOFrom(persona.headshotImage) : undefined,
    bodyImage: persona.bodyImage ? assetDTOFrom(persona.bodyImage) : undefined,
  }
}
