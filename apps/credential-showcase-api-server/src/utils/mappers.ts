import {
  Asset as AssetDTO,
  AssetRequest,
  CredentialDefinition as CredentialDefinitionDTO,
  IssuanceScenario as IssuanceScenarioDTO,
  Issuer as IssuerDTO,
  Persona as PersonaDTO,
  PresentationScenario as PresentationScenarioDTO,
  RelyingParty as RelyingPartyDTO,
  Showcase as ShowcaseDTO,
  Step as StepDTO,
  User as UserDTO,
  UserRequest,
} from 'credential-showcase-openapi'
import {
  Asset,
  CredentialDefinition,
  IssuanceScenario,
  Issuer,
  NewAsset,
  NewScenario,
  NewUser,
  Persona,
  PresentationScenario,
  RelyingParty,
  Scenario,
  ScenarioType,
  Showcase,
  Step,
  User,
} from '../types'

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
    schemaId: credentialDefinition.credentialSchema.id,
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

export const issuanceScenarioDTOFrom = (issuanceScenario: IssuanceScenario): IssuanceScenarioDTO => {
  if (!issuanceScenario.issuer) {
    throw Error('Missing issuer in issuance scenario')
  }

  return {
    ...issuanceScenario,
    issuer: issuerDTOFrom(issuanceScenario.issuer),
    type: ScenarioType.ISSUANCE,
    steps: issuanceScenario.steps.map((step) => stepDTOFrom(step)),
    personas: issuanceScenario.personas.map((persona) => personaDTOFrom(persona)),
  }
}

export const presentationScenarioDTOFrom = (presentationScenario: PresentationScenario): PresentationScenarioDTO => {
  if (!presentationScenario.relyingParty) {
    throw Error('Missing relying party in presentation scenario')
  }

  return {
    ...presentationScenario,
    relyingParty: relyingPartyDTOFrom(presentationScenario.relyingParty),
    type: ScenarioType.PRESENTATION,
    steps: presentationScenario.steps.map((step) => stepDTOFrom(step)),
    personas: presentationScenario.personas.map((persona) => personaDTOFrom(persona)),
  }
}

export const scenarioDTOFrom = (scenario: Scenario): IssuanceScenarioDTO | PresentationScenarioDTO => {
  switch (scenario.scenarioType) {
    case ScenarioType.PRESENTATION:
      return presentationScenarioDTOFrom(scenario)
    case ScenarioType.ISSUANCE:
      return issuanceScenarioDTOFrom(scenario)
    default:
      throw Error(`Unsupported scenario type ${scenario.scenarioType}`)
  }
}

export const stepDTOFrom = (step: Step): StepDTO => {
  return {
    ...step,
    asset: step.asset ? assetDTOFrom(step.asset) : undefined,
    subScenario: step.subScenario ? step.subScenario : undefined,
  }
}

export const personaDTOFrom = (persona: Persona): PersonaDTO => {
  return {
    ...persona,
    headshotImage: persona.headshotImage ? assetDTOFrom(persona.headshotImage) : undefined,
    bodyImage: persona.bodyImage ? assetDTOFrom(persona.bodyImage) : undefined,
    hidden: persona.hidden,
  }
}

export const showcaseDTOFrom = (showcase: Showcase): ShowcaseDTO => {
  return {
    ...showcase,
    personas: showcase.personas.map((persona) => personaDTOFrom(persona)),
    credentialDefinitions: showcase.credentialDefinitions.map((credentialsDefinition) => credentialDefinitionDTOFrom(credentialsDefinition)),
    scenarios: showcase.scenarios.map((scenario) => scenarioDTOFrom(scenario)),
    bannerImage: showcase.bannerImage ? assetDTOFrom(showcase.bannerImage) : undefined,
    completionMessage: showcase.completionMessage ? showcase.completionMessage : undefined,
  }
}

export const newUserFrom = (user: UserRequest): NewUser => {
  return {
    ...user,
  }
}

export const userDTOFrom = (user: User): UserDTO => {
  return {
    ...user,
    identifier: user.identifier ? user.identifier : undefined,
  }
}

export const isPresentationScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'relyingParty' in scenario
}

export const isIssuanceScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'issuer' in scenario
}
