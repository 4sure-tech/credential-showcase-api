import {
  Asset as AssetDTO,
  AssetRequest,
  CredentialDefinition as CredentialDefinitionDTO,
  CredentialSchema as CredentialSchemaDTO,
  IssuanceScenario as IssuanceScenarioDTO,
  Issuer as IssuerDTO,
  Persona as PersonaDTO,
  PresentationScenario as PresentationScenarioDTO,
  RelyingParty as RelyingPartyDTO,
  Showcase as ShowcaseDTO,
  ShowcasePersonasInner,
  Step as StepDTO,
} from 'credential-showcase-openapi'
import {
  Asset,
  CredentialDefinition,
  CredentialSchema,
  IssuanceScenario,
  Issuer,
  NewAsset,
  NewScenario,
  Persona,
  PresentationScenario,
  RelyingParty,
  Scenario,
  ScenarioType,
  Showcase,
  Step,
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
    fileName: asset.fileName || undefined,
    description: asset.description || undefined,
    content: asset.content.toString(),
  }
}

export const credentialSchemaDTOFrom = (credentialSchema: CredentialSchema): CredentialSchemaDTO => {
  return {
    ...credentialSchema,
    identifierType: credentialSchema.identifierType || undefined,
    identifier: credentialSchema.identifier || undefined,
    source: credentialSchema.source || undefined,
  }
}

export const credentialDefinitionDTOFrom = (credentialDefinition: CredentialDefinition): CredentialDefinitionDTO => {
  return {
    ...credentialDefinition,
    identifierType: credentialDefinition.identifierType || undefined,
    identifier: credentialDefinition.identifier || undefined,
    credentialSchema: credentialSchemaDTOFrom(credentialDefinition.credentialSchema),
    representations: credentialDefinition.representations,
    revocation: credentialDefinition.revocation || undefined,
    iconId: typeof credentialDefinition.icon === 'string' ? credentialDefinition.icon : undefined,
    icon: credentialDefinition.icon && typeof credentialDefinition.icon !== 'string' ? assetDTOFrom(credentialDefinition.icon as Asset) : undefined,
  }
}

export const relyingPartyDTOFrom = (relyingParty: RelyingParty): RelyingPartyDTO => {
  return {
    ...relyingParty,
    organization: relyingParty.organization || undefined,
    logoId: typeof relyingParty.logo === 'string' ? relyingParty.logo : undefined,
    logo: relyingParty.logo && typeof relyingParty.logo !== 'string' ? assetDTOFrom(relyingParty.logo as Asset) : undefined,
    credentialDefinitions: relyingParty.credentialDefinitions.map(credentialDefinitionDTOFrom),
  }
}

export const issuerDTOFrom = (issuer: Issuer): IssuerDTO => {
  return {
    ...issuer,
    organization: issuer.organization || undefined,
    logoId: typeof issuer.logo === 'string' ? issuer.logo : undefined,
    logo: issuer.logo && typeof issuer.logo !== 'string' ? assetDTOFrom(issuer.logo as Asset) : undefined,
    credentialDefinitions: issuer.credentialDefinitions.map(credentialDefinitionDTOFrom),
    credentialSchemas: issuer.credentialSchemas.map(credentialSchemaDTOFrom),
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
    steps: issuanceScenario.steps.map(stepDTOFrom),
    personas: issuanceScenario.personas.map(personaDTOFrom),
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
    steps: presentationScenario.steps.map(stepDTOFrom),
    personas: presentationScenario.personas.map(personaDTOFrom),
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
    assetId: typeof step.asset === 'string' ? step.asset : undefined,
    asset: step.asset && typeof step.asset !== 'string' ? assetDTOFrom(step.asset as Asset) : undefined,
    subScenario: step.subScenario || undefined,
  }
}

export const personaDTOFrom = (persona: Persona): PersonaDTO => {
  return {
    ...persona,
    headshotImageId: typeof persona.headshotImage === 'string' ? persona.headshotImage : undefined,
    headshotImage: persona.headshotImage && typeof persona.headshotImage !== 'string' ? assetDTOFrom(persona.headshotImage as Asset) : undefined,
    bodyImageId: typeof persona.bodyImage === 'string' ? persona.bodyImage : undefined,
    bodyImage: persona.bodyImage && typeof persona.bodyImage !== 'string' ? assetDTOFrom(persona.bodyImage as Asset) : undefined,
    hidden: persona.hidden,
  }
}

export const showcasePersonaDTOFrom = (persona: Persona): ShowcasePersonasInner => {
  return {
    ...persona,
    headshotImageId: typeof persona.headshotImage === 'string' ? persona.headshotImage : undefined,
    headshotImage: persona.headshotImage && typeof persona.headshotImage !== 'string' ? assetDTOFrom(persona.headshotImage as Asset) : undefined,
    bodyImageId: typeof persona.bodyImage === 'string' ? persona.bodyImage : undefined,
    bodyImage: persona.bodyImage && typeof persona.bodyImage !== 'string' ? assetDTOFrom(persona.bodyImage as Asset) : undefined,
    hidden: persona.hidden,
  }
}

export const showcaseDTOFrom = (showcase: Showcase): ShowcaseDTO => {
  return {
    ...showcase,
    personas: [], // showcase.personas.map(showcasePersonaDTOFrom as Persona), // FIXME
    credentialDefinitions: showcase.credentialDefinitions.map(credentialDefinitionDTOFrom),
    scenarios: showcase.scenarios.map(scenarioDTOFrom),
    bannerImageId: typeof showcase.bannerImage === 'string' ? showcase.bannerImage : undefined,
    bannerImage: showcase.bannerImage && typeof showcase.bannerImage !== 'string' ? assetDTOFrom(showcase.bannerImage as Asset) : undefined,
    completionMessage: showcase.completionMessage || undefined,
  }
}

export const isPresentationScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'relyingParty' in scenario
}

export const isIssuanceScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'issuer' in scenario
}
