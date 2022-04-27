import {createHash} from 'crypto'
import {ReadableStream} from 'node:stream/web'
import {encodeData, formatComment, formatEvent} from './format'
import {MULTIBYTE_EMOJIS, MULTIBYTE_LINES} from './multibyte'

const TEN_MEGABYTES = 1024 * 1024 * 10
const EMOJI_DATA = MULTIBYTE_EMOJIS.join(' ')
const DATA_CHUNK = encodeData(`${MULTIBYTE_LINES.join('\n\n')}\n${EMOJI_DATA}`).trim()
const DATA_CHUNK_LENGTH = Buffer.from(DATA_CHUNK).byteLength
const DATA_CHUNK_WAIT = Math.floor(5000 / (TEN_MEGABYTES / DATA_CHUNK_LENGTH))

export function getBasicFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        controller.enqueue(formatEvent({data: `${i}`}))
        await delay(250)
      }

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getTimeFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        controller.enqueue(formatEvent({event: 'time', data: new Date().toISOString()}))
        await delay(250)
      }

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getIdentifiedFixtureStream(start: number): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      for (let id = start; id < start + 2; id++) {
        controller.enqueue(formatEvent({event: 'tick', data: `${id}`, id: `${id}`, retry: 50}))
        await delay(250)
      }

      if (start >= 4) {
        controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      }

      controller.close()
    },
  })
}

export function getHeartbeatsFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        controller.enqueue(formatComment(' ♥'))
        controller.enqueue(formatEvent(String.fromCharCode(65 + i)))
        await delay(250)
      }

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getSilenceFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      await delay(2500)
      controller.close()
    },
  })
}

export function getMultilineFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      controller.enqueue('event: stock\n')
      controller.enqueue('data: YHOO\n')
      controller.enqueue('data: +2\n')
      controller.enqueue('data: 10\n\n')

      await delay(250)

      controller.enqueue('event: stock\n')
      controller.enqueue('data: GOOG\n')
      controller.enqueue('data: -8\n')
      controller.enqueue('data: 1881\n\n')

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getMultibyteFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      const emojis = MULTIBYTE_EMOJIS
      const lines = MULTIBYTE_LINES
      const emojisPerMessage = Math.ceil(emojis.length / lines.length)

      for (let i = 0; i < lines.length; i++) {
        const split = i % 2 === 0 // Split into separate data chunks in the case of even lines
        const linejis = emojis
          .slice(emojisPerMessage * i, emojisPerMessage * i + emojisPerMessage)
          .join(' ')
        const line = `${lines[i]} ${linejis}`
        controller.enqueue(`id: ${i}\n`)
        if (split) {
          controller.enqueue(`data:${line.slice(0, 5)}\n`)
          controller.enqueue(`data:${line.slice(5)}\n\n`)
        } else {
          controller.enqueue(`data:${line}\n\n`)
        }
        await delay(50)
      }

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getMultibyteEmptyLineFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('\n\n\n\nid: 1\ndata: 我現在都看實況不玩遊戲\n\n')
      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getBomFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('\uFEFFdata: bomful 1\n\n')
      controller.enqueue('\uFEFFdata: bomful 2\n\n')
      controller.enqueue('data: bomless 3\n\n')
      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getCarriageReturnFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('data: dog\r')
      controller.enqueue('data: bark\r\r')

      controller.enqueue('data: cat\r')
      controller.enqueue('data: meow\r\r')

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getLineFeedFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('data: cow\n')
      controller.enqueue('data: moo\n\n')

      controller.enqueue('data: horse\n')
      controller.enqueue('data: neigh\n\n')

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getCarriageReturnLineFeedFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('data: sheep\r\n')
      controller.enqueue('data: bleat\r\n\r\n')

      controller.enqueue('data: pig\r\n')
      controller.enqueue('data: oink\r\n\r\n')

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getCommentsFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      controller.enqueue(': Hello\n\n')
      controller.enqueue(':'.repeat(300))
      controller.enqueue('\n')
      await delay(250)

      controller.enqueue('data: First\n\n')
      controller.enqueue(': Первый')
      await delay(250)

      controller.enqueue(': 第二')
      controller.enqueue('\n')
      controller.enqueue('data: Second\n\n')
      await delay(250)

      for (let i = 0; i < 10; i++) {
        controller.enqueue(': Moop \n')
      }

      controller.enqueue(': ثالث')
      controller.enqueue('\n')
      controller.enqueue('data: Third\n\n')
      await delay(250)

      controller.enqueue(':നാലാമത്തെ')
      controller.enqueue('\n')
      controller.enqueue('data: Fourth\n\n')
      await delay(250)

      controller.enqueue(`: ${MULTIBYTE_EMOJIS.slice(0, 100).join(' ')} :`)
      controller.enqueue('\n')
      controller.enqueue('data: Fifth\n\n')

      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getMixedCommentsFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      const longString = 'x'.repeat(2 * 1024 + 1)
      controller.enqueue('data:1\r\r:\0\n:\r\ndata:2\n\n:')

      await delay(50)

      controller.enqueue(longString)

      await delay(50)

      controller.enqueue('\rdata:3\n\n:data:fail\r:')
      controller.enqueue(longString)

      await delay(50)

      controller.enqueue('\ndata:4\n\n')
      await delay(250)

      controller.enqueue('data:5')
      await delay(250)

      controller.close()
    },
  })
}

export function getEmptyEventsFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('event:\ndata: Hello 1\n\n')
      controller.enqueue('event:\n\n')
      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getEmptyRetryFixtureStream(last: number | undefined): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      if (!last) {
        controller.enqueue(formatEvent({id: '1', retry: 500, data: '🥌'}))
      } else if (last === 1) {
        controller.enqueue('id:2\nretry:\ndata:🧹\n\n')
      } else {
        controller.enqueue(formatEvent({id: '3', data: '✅'}))
      }
      controller.close()
    },
  })
}

export function getFieldParsingFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue(
        'data:\0\ndata:  2\rData:1\ndata\0:2\ndata:1\r\0data:4\nda-ta:3\rdata_5\ndata:3\rdata\ndata:\r\n data:32\ndata:4\n\n'
      )
      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getDataFieldParsingFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('data:\n\ndata\ndata\n\ndata:test\n\n')
      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getInvalidRetryFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue('retry:1000\nretry:2000x\ndata:x\n\n')
      controller.close()
    },
  })
}

export function getUnknownFieldsFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue(
        'data:test\n data\ndata\nfoobar:xxx\njustsometext\n:thisisacommentyay\ndata:test\n\n'
      )
      controller.enqueue(formatEvent({event: 'done', data: '✔'}))
      controller.close()
    },
  })
}

export function getHugeMessageFixtureStream(): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      controller.enqueue(': hello\n\n')

      const hash = createHash('md5')

      let written = 0
      while (written < TEN_MEGABYTES) {
        hash.update(DATA_CHUNK)
        controller.enqueue(DATA_CHUNK)
        written += DATA_CHUNK_LENGTH
        await delay(DATA_CHUNK_WAIT)
      }

      controller.enqueue('\n\n')
      controller.enqueue(': END-OF-STREAM\n\n')
      controller.enqueue(formatEvent({event: 'done', data: hash.digest('hex')}))
      controller.close()
    },
  })
}

export function getHeadersFixtureStream(headers: any): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue(formatEvent({event: 'headers', data: JSON.stringify(headers)}))
      controller.close()
    },
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
