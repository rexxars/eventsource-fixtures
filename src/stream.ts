import {Writable} from 'node:stream'
import {ReadableStream} from 'node:stream/web'

export async function pipeToNodeStream(input: ReadableStream, output: Writable): Promise<void> {
  for await (const value of input) {
    output.write(value)
  }

  output.end()
}
