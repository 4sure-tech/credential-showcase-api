// FAKE controller until the real one is merged

async function main() {
  try {
    console.log('AMQ 1.0 message processor started')

    // Keep the process alive with a never-resolving promise or interval
    const keepAlive = setInterval(() => {
      console.log('Process still alive: ' + new Date().toISOString())
    }, 60000) // Log once per minute to show it's still running

    process.on('SIGINT', async () => {
      console.log('Received SIGINT. Shutting down...')
      clearInterval(keepAlive)
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM. Shutting down...')
      clearInterval(keepAlive)
      process.exit(0)
    })

    process.stdin.resume()
    console.log('Process will stay alive until manually stopped')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

void main()
