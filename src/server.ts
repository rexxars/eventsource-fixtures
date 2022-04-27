import express, {NextFunction, Request, Response} from 'express'
import {formatEvent} from './format'
import {pipeToNodeStream} from './stream'
import {
  getBasicFixtureStream,
  getBomFixtureStream,
  getCarriageReturnFixtureStream,
  getCarriageReturnLineFeedFixtureStream,
  getCommentsFixtureStream,
  getDataFieldParsingFixtureStream,
  getEmptyEventsFixtureStream,
  getEmptyRetryFixtureStream,
  getFieldParsingFixtureStream,
  getHeadersFixtureStream,
  getHeartbeatsFixtureStream,
  getHugeMessageFixtureStream,
  getIdentifiedFixtureStream,
  getInvalidRetryFixtureStream,
  getLineFeedFixtureStream,
  getMixedCommentsFixtureStream,
  getMultibyteEmptyLineFixtureStream,
  getMultibyteFixtureStream,
  getMultilineFixtureStream,
  getSilenceFixtureStream,
  getTimeFixtureStream,
  getUnknownFieldsFixtureStream,
} from './fixtures'

const app = express()
const port = 8080

app.disable('x-powered-by')
app.use('/', express.static('public', {maxAge: 0, immutable: false}))

app.get('/basic', prepare, async (req, res) => {
  await pipeToNodeStream(getBasicFixtureStream(), res)
})

app.get('/time', prepare, async (req, res) => {
  await pipeToNodeStream(getTimeFixtureStream(), res)
})

app.get('/identified', prepare, async (req, res) => {
  const last = getLastEventId(req)
  const start = last ? last + 1 : 0

  if (start > 6) {
    res.status(400).send(formatEvent({event: 'error', data: 'Last event ID out of range'}))
    return
  }

  await pipeToNodeStream(getIdentifiedFixtureStream(start), res)
})

app.get('/heartbeats', prepare, async (req, res) => {
  await pipeToNodeStream(getHeartbeatsFixtureStream(), res)
})

app.get('/silence', prepare, async (req, res) => {
  await pipeToNodeStream(getSilenceFixtureStream(), res)
})

app.get('/multiline', prepare, async (req, res) => {
  await pipeToNodeStream(getMultilineFixtureStream(), res)
})

app.get('/multibyte', prepare, async (req, res) => {
  await pipeToNodeStream(getMultibyteFixtureStream(), res)
})

app.get('/multibyte-empty-line', prepare, async (req, res) => {
  await pipeToNodeStream(getMultibyteEmptyLineFixtureStream(), res)
})

app.get('/bom', prepare, async (req, res) => {
  await pipeToNodeStream(getBomFixtureStream(), res)
})

app.get('/cr', prepare, async (req, res) => {
  await pipeToNodeStream(getCarriageReturnFixtureStream(), res)
})

app.get('/lf', prepare, async (req, res) => {
  await pipeToNodeStream(getLineFeedFixtureStream(), res)
})

app.get('/crlf', prepare, async (req, res) => {
  await pipeToNodeStream(getCarriageReturnLineFeedFixtureStream(), res)
})

app.get('/comments', prepare, async (req, res) => {
  await pipeToNodeStream(getCommentsFixtureStream(), res)
})

app.get('/comments-mixed', prepare, async (req, res) => {
  await pipeToNodeStream(getMixedCommentsFixtureStream(), res)
})

app.get('/empty-events', prepare, async (req, res) => {
  await pipeToNodeStream(getEmptyEventsFixtureStream(), res)
})

app.get('/empty-retry', prepare, async (req, res) => {
  const last = getLastEventId(req)
  await pipeToNodeStream(getEmptyRetryFixtureStream(last), res)
})

app.get('/field-parsing', prepare, async (req, res) => {
  await pipeToNodeStream(getFieldParsingFixtureStream(), res)
})

app.get('/data-field-parsing', prepare, async (req, res) => {
  await pipeToNodeStream(getDataFieldParsingFixtureStream(), res)
})

app.get('/invalid-retry', prepare, async (req, res) => {
  await pipeToNodeStream(getInvalidRetryFixtureStream(), res)
})

app.get('/unknown-fields', prepare, async (req, res) => {
  await pipeToNodeStream(getUnknownFieldsFixtureStream(), res)
})

app.get('/huge-message', prepare, async (req, res) => {
  await pipeToNodeStream(getHugeMessageFixtureStream(), res)
})

app.use('/headers', prepare, async (req, res) => {
  await pipeToNodeStream(getHeadersFixtureStream(req.headers), res)
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fixture server listening at http://localhost:${port}`)
})

function getLastEventId(req: Request): number | undefined {
  const last = req.headers['last-event-id'] || ''
  return typeof last === 'string' ? parseInt(last, 10) : undefined
}

function prepare(req: Request, res: Response, next: NextFunction) {
  req.socket.setTimeout(0)
  req.socket.setNoDelay(true)
  req.socket.setKeepAlive(true)

  const last = req.headers['last-event-id']
  const isValidRequest =
    typeof last === 'undefined' || (typeof last === 'string' && !isNaN(parseInt(last, 10)))

  res.writeHead(isValidRequest ? 200 : 250, {
    'Content-Type': 'text/event-stream;charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  if (!isValidRequest) {
    res.write(formatEvent('Invalid `Last-Event-ID` header'))
    res.end()
    return
  }

  next()
}
