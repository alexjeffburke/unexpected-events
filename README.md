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

describe('single event', function () {
    it('should see the event', function () {
        var emitter = new EventEmitter();

        // issue the event once listeners have a chance to attach
        process.nextTick(function () {
            ev.emit('foo', 'bar', 'baz');
        });

        emitter(ev, 'for the first event on', 'foo', 'to equal', ['bar', 'baz']);
    });
});
```

In this case you can see an event on the channel _foo_ with the values
_foo_ and _bar_ being sent.

Two special assertions are provided in case you need to ignore messages on the
channel before doing the matching.

- check the second event (i.e. skip **one** event)

    ```js
    emitter(ev, 'for the second event values on', 'foo', 'to equal', 'something');
    ```

- check the third event (i.e. skip **two** events)

    ```js
    emitter(ev, 'for the second event values on', 'foo', 'to equal', 'something');
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
            ev.emit('foo', 'bar', 'baz');
        });

        emitter(ev, 'for the first event values on', 'foo', 'to equal', 'bar', 'baz');
    });
});
```

For your convenience you understand.

## Check multiple events

If you want to check a series of messages on a channel, there is an assertion
for you too!

```js
var EventEmitter = require('events').EventEmitter;
var expect = require('unexpected').clone();

describe('multiple test', function () {
    it('should see them all', function () {
        var emitter = new EventEmitter();

        // issue the event once listeners have a chance to attach
        process.nextTick(function () {
            ev.emit('foo', 'bar');
            ev.emit('foo', 'baz');
        });

        emitter(ev, 'for the multiple event on', 'foo', 'to equal', [
            ['bar'],
            ['baz']
        ]);
    });
});
```

## License

Licensed under a standard 3-clause BSD license -- see the `LICENSE` file for details.
