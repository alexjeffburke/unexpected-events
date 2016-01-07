unexpected-events
==================

This unexpected plugin enables unit testing of EventEmitters.

## Check a single event

To check an event is produced the _'for the first event on'_ assertion is
provided - you specify the channel and the assertion to use when doing the
match:

```js
var EventEmitter = require('events').EventEmitter;
var expect = require('unexpected').clone();

expect.installPlugin(require('unexpected-events'));

describe('single event', function () {
    it('should see the event', function () {
        var emitter = new EventEmitter();

        // issue the event once listeners have a chance to attach
        process.nextTick(function () {
            emitter.emit('foo', 'bar', 'baz');
        });

        expect(emitter, 'for the first event on', 'foo', 'to equal', ['bar', 'baz']);
    });
});
```

In this case you can see an event on the channel _foo_ with the values
_foo_ and _bar_ being sent.

Two special forms of the assertion are provided in case you need to ignore a
certain number of messages before doing the comparisons:

- check the second event (i.e. skip **one** event)

    ```js
    expect(emitter, 'for the second event on', 'foo', 'to equal', ['something']);
    ```

- check the third event (i.e. skip **two** events)

    ```js
    expect(emitter, 'for the third event on', 'foo', 'to equal', ['something']);
    ```

### Readability

For ease of readability you can also remove the array around the event values
by brandishing the optional _values_ flag in the assertion:

```js
var EventEmitter = require('events').EventEmitter;
var expect = require('unexpected').clone();

describe('basic test with varargs', function () {
    it('should match an event', function () {
        var emitter = new EventEmitter();

        // issue the event once listeners have a chance to attach
        process.nextTick(function () {
            emitter.emit('foo', 'bar', 'baz');
        });

        expect(emitter, 'for the event values on', 'foo', 'to equal', 'bar', 'baz');
    });
});
```

You'll also notice, as in the example above, you can drop the word _first_ when
comparing a single event.

For your convenience you understand.

## Check multiple events

If you want to check a series of messages on a channel, there is an assertion
for you too!

```js
var EventEmitter = require('events').EventEmitter;
var expect = require('unexpected').clone();

expect.installPlugin(require('unexpected-events'));

describe('multiple test', function () {
    it('should see them all', function () {
        var emitter = new EventEmitter();

        // issue the event once listeners have a chance to attach
        process.nextTick(function () {
            emitter.emit('foo', 'bar');
            emitter.emit('foo', 'baz');
        });

        expect(emitter, 'for multiple events on', 'foo', 'to equal', [
            ['bar'],
            ['baz']
        ]);
    });
});
```

## License

Licensed under a standard 3-clause BSD license -- see the `LICENSE` file for details.
