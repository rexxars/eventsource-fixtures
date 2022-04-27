# eventsource-fixtures

A collection of readable streams and an HTTP server that emulates a number of different server-sent event cases, primarily for testing eventsource clients/implementations

## Endpoints

- `/basic` - emits a new unnamed event with a number as the value every 250ms until 5 events are emitted, then sends a `done` message and closes the connection. No comments sent. No IDs on messages.

- `/time` - emits a new `time` event with a timestamp as the value every 250ms until 5 events are emitted, then sends a `done` message and closes the connection. No comments sent. No IDs on messages.

- `/identified` - emits a new `tick` event with an increasing number as the value every 250ms until 2 events are emitted, then sends a `done` message and closes the connection. No comments sent. Uses the `last-event-id` +1 as the start value (must be a number).

- `/heartbeats` - emits a new unnamed event with an increasing character as the value every 250ms until 5 events are emitted, then sends a `done` message and closes the connection. Before each event, it will emit a "heartbeat" in the shape of a comment. No IDs on messages.

- `/silence` - an empty stream with no heartbeats, but with the correct SSE headers. Closes after 2.5 seconds.

- `/multiline` - sends two messages that wraps over multiple lines, eg with individual `data` chunks forming a single message. Then sends a `done` message and closes the connection. No comments sent. No IDs on messages.

- `/multibyte` - sends 14 messages that contains unicode multi-byte characters as part of individual messages. Closes with a `done` event being emitted. No comments sent. Messages are IDed by line number.

- `/multibyte-empty-line` - sends a multibyte message preceded by empty lines. Parser edge-case. Closes with a `done` event being emitted. No IDs on messages.

- `/bom` - starts the stream with a byte order mark, then sends one unnamed message, then an invalid message because the `data:` prefix includes another BOM, then sends a third and valid message. Closes with a `done` event being emitted. No IDs on messages. Note that the first byte order mark should be stripped (eg disregarded) according to the eventsource specification, but the second should be treated as invalid.

- `/cr` - separates events by carriage return characters. Sends two unnamed messages, followed by a `done` event, then closes the connection. No IDs on messages.

- `/lf` - separates events by line feed characters. Sends two unnamed messages, followed by a `done` event, then closes the connection. No IDs on messages.

- `/crlf` - separates events by cr+lf characters. Sends two unnamed messages, followed by a `done` event, then closes the connection. No IDs on messages.

- `/comments` - sends comments between messages that are to be disregarded, of various lengths and characters. Closes after five messages and a `done` message being emitted. No IDs on messages.

- `/comments-mixed` - sends poorly formatted messages with comments intertwined, that should be parsed as four unnamed messages of `1`, `2`, `3` and `4` as the values. Closes after the fourth message, with no `done` message. No IDs sent.

- `/empty-events` - sends a message with an empty `event` chunk, followed by valid data. Then sends an empty `event` chunk with no data. Closes with a `done` event. No IDs on messages.

- `/empty-retry` - sends a message with a valid, short `retry` (50ms), then closes the connection. On reconnection with a valid `last-event-id`, follows up with a message with an empty `retry` chunk, followed by valid data.

- `/field-parsing` - sends message with differing chunk formatting to test the parser being resilient to incorrectly shaped data. Should end up with a message containing value `\0\n 2\n1\n3\n\n\n4`

- `/data-field-parsing` - sends what should end up as three individual messages, their contents being `''` (empty string), `\n` and `test`, along with some invalid data in order to test parsing of the `data` chunk. Closes with a `done` event. No IDs on messages.

- `/invalid-retry` - sends two `retry` chunks, one being valid, the next not. Emits a single message, then closes the connection. No IDs on message.

- `/unknown-fields` - tests parser by sending unknown fields and other edge-cases. Should be parsed as a single message with the value `test\n\ntest`. Closes with a `done` event. No IDs on messages.

- `/huge-message` - tests receiving and parsing of a huge message (~10MB), trinkling out over a period of ~5-6 seconds. Ends with a `done` message, the value being the md5 checksum of the sent data. No IDs on messages.

- `/headers` - sends back a message with the request headers as they are received by the server, encoded with JSON, then closes the connection. No IDs on messages.

## To be implemented

- `/redirect`
- `/redirect-missing-location`
- `/error`
- `/retry`
- `/post`

## Notes

- Retry behavior differs greatly between implementations. Default reconnection time is determined by the implementor. Some implementations set a lower threshold on reconnection time (Firefox won't go lower than 500ms for instance). Chrome incorrectly treats an empty (invalid) `retry` as "reset reconnection time", while Firefox ignores it (as per the spec).
