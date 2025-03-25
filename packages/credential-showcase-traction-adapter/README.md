# Credential Showcase Traction Adapter

**Version:** 0.1.0  
**License:** Apache-2.0  
**Author:** 4Sure

## 📝 Module Overview

The **Credential Showcase Traction Adapter** bridges the **Interactive Digital Credential Showcase Builder** with **Traction/ACA-Py**, providing a scalable, asynchronous integration between technology-agnostic data models and credential-specific implementations.

### 💡 Purpose

- Translate data model actions (e.g., credential definitions, flows) into **Traction/ACA-Py** operations
- Decouple the builder's core REST API from credential technology details, future-proofing for multiple adapter implementations

### ⚙️ Core Functionalities

- **Asynchronous Messaging:** Uses AMQP 1.0 messaging (via RabbitMQ) to handle data exchange, improving fault tolerance
- **Credential Definition Synchronization:** Converts credential definitions in the Showcase Builder into schemas and credential definitions in Traction/ACA-Py
- **Event-Driven Architecture:** Processes only the messages it can handle, simplifying horizontal scaling and maintainability
- **Error Handling & Consistency:** Ensures durable message delivery and logs all failures for quick resolution

## 📁 Project Structure

```
credential-showcase-traction-adapter/
├── src/
│   ├── index.ts                  # Main entry point
│   ├── message-processor.ts      # AMQP message processing
│   ├── environment.ts            # Environment configuration
│   ├── types.ts                  # Shared type definitions
│   ├── mappers/
│   │   └── credential-definition.ts # Mapping between data models
│   └── services/
│       ├── service-manager.ts    # Manages tenant/wallet sessions
│       └── traction-service.ts   # Traction API integration
├── __tests__/
│   └── message-processor.test.ts # Integration tests for messaging
├── dist/                         # Compiled output
├── package.json                  # Project configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## 🛠️ Tech Stack

- **Language:** TypeScript
- **Messaging:** rhea, rhea-promise (AMQP 1.0 clients)
- **Caching:** lru-cache (for tenant session management)
- **Testing:** Jest, Testcontainers (@testcontainers/rabbitmq)
- **Dependencies:** credential-showcase-openapi, credential-showcase-traction-openapi

## 📦 Package Management

This project uses **pnpm** and **turbo** for monorepo and package management.

### Install Dependencies

```bash
pnpm install
```

### Build the Project

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Start the Project

```bash
pnpm start
```

## 🧪 Testing

The project includes integration tests for the RabbitMQ messaging functionality:

```
src/__tests__/message-processor.test.ts
```

These tests verify:

- Message processing for valid credential definitions
- Error handling for invalid messages (missing actions, tenants, etc.)
- RabbitMQ connectivity and durability

## 🔬 Advanced Topics

### Message Processing Workflow

1. The adapter listens to a configurable AMQP topic (default: `SHOWCASE_CMD`)
2. Messages contain credential definitions and actions (e.g., `store-credentialdef`)
3. Required headers include `tenantId`, `action`, and optionally `apiUrlBase`, `walletId`, and `accessTokenEnc`
4. The processor validates messages and routes them to appropriate handlers

### Traction Service Integration

The adapter provides several credential operations:

- Schema creation and lookup
- Credential definition creation and lookup
- Tenant token management
- Wallet token management

### Tenant/Wallet Session Management

A service manager provides:

- LRU caching of tenant sessions
- Configurable TTL and cache sizes
- Token refreshing for existing sessions

### Error Handling

Durable messaging ensures errors do not cause data loss:

- Invalid messages are rejected with descriptive errors
- Processing failures are logged with contextual details
- Message acceptance only occurs after successful processing

### Eventual Consistency

Since communication between the Showcase Builder and this adapter is asynchronous, the system is eventually consistent rather than transactionally consistent. Flows and credential definitions remain in a "pending" state until the adapter successfully updates the Traction/ACA-Py layer.

## 📖 Documentation

For more details on flows, data models, and API usage, please refer to the main **Interactive Digital Credential Showcase Builder** documentation.

## 🏷️ License

This project is licensed under the **Apache-2.0** license.
