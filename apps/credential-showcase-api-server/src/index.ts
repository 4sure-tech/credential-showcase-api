
import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import Container from 'typedi'
import express from 'express'
import cors from 'cors'

import { ExpressErrorHandler } from './middleware/ExpressErrorHandler'
import AssetController from './controllers/AssetController'
import PersonaController from './controllers/PersonaController'
import RelyingPartyController from './controllers/RelyingPartyController'
import IssuerController from './controllers/IssuerController'
import IssuanceScenarioController from './controllers/IssuanceScenarioController'
import PresentationScenarioController from './controllers/PresentationScenarioController'
import ShowcaseController from './controllers/ShowcaseController'
import { CredentialDefinitionController } from './controllers/CredentialDefinitionController'
import { CredentialSchemaController } from './controllers/CredentialSchemaController'

require('dotenv-flow').config()

// Ensure routing-controllers uses typedi for DI
useContainer(Container)

async function bootstrap() {
  try {
    // Create a base Express app first
    const app = express()
    
    // Apply CORS middleware BEFORE routing-controllers
    app.use(cors({
      origin: ['https://bcshowcase-api-dev.nborbit.ca', 'https://bcshowcase-api.dev.nborbit.ca'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }))
    
    // Now use routing-controllers with the existing Express app
    const routingControllersOptions = {
      controllers: [
        AssetController,
        PersonaController,
        CredentialSchemaController,
        CredentialDefinitionController,
        RelyingPartyController,
        IssuerController,
        IssuanceScenarioController,
        PresentationScenarioController,
        ShowcaseController,
      ],
      middlewares: [ExpressErrorHandler],
      defaultErrorHandler: false,
      routePrefix: '/',
    }
    
    // Apply routing-controllers to the existing app
    const server = createExpressServer(routingControllersOptions)

    // Start the server
    const port = Number(process.env.PORT)

    server.listen(port, (): void => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start application:', error)
    process.exit(1)
  }
}

// Start the application
bootstrap()