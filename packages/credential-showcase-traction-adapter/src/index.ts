// FAKE controller

async function main() {
  try {
    console.log('AMQ 1.0 message processor started')

    process.on('SIGINT', async () => {
      console.log('Received SIGINT. Shutting down...')
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM. Shutting down...')
      process.exit(0)
    })

    process.stdin.resume()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

void main()
