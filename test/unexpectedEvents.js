var EventEmitter = require('events').EventEmitter;
var expect = require('unexpected');
var unexpectedEvents = require('../lib/unexpectedEvents');

describe('unexpected-events', function () {
    expect = expect.clone();
    expect.installPlugin(unexpectedEvents);

    it('should error on an undefined value', function () {
        var ev = new EventEmitter();

        process.nextTick(function () {
            ev.emit('foo', 'bar');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal')
        , 'to be rejected');
    });

    it('should error on a function value', function () {
        var ev = new EventEmitter();

        process.nextTick(function () {
            ev.emit('foo', 'bar');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', function () {})
        , 'to be rejected');
    });

    it('should error on a null value', function () {
        var ev = new EventEmitter();

        process.nextTick(function () {
            ev.emit('foo', 'bar');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', null)
        , 'to be rejected');
    });

    it('should error on an object value', function () {
        var ev = new EventEmitter();

        process.nextTick(function () {
            ev.emit('foo', 'bar');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', {})
        , 'to be rejected');
    });

    it('should error on incomplete message', function () {
        var ev = new EventEmitter();

        process.nextTick(function () {
            ev.emit('foo', 'bar');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', ['bar', 'baz'])
        , 'to be rejected');
    });

    it('should error on incomplete parts list', function () {
        var ev = new EventEmitter();

        process.nextTick(function () {
            ev.emit('foo', 'bar', 'baz');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', ['bar'])
        , 'to be rejected');
    });

    it('should error on event timeout', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        setTimeout(function () {
            ev.emit('foo');
        }, 2500);

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', ['bar'])
        , 'to be rejected with', 'Expected event not seen prior to timeout.');
    });

    it('should succeed when the event matches expectations', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        process.nextTick(function () {
            ev.emit('foo', 'bar', 'baz');
        });

        return expect(
            expect(ev, 'for the event on', 'foo', 'to equal', ['bar', 'baz'])
        , 'to be fulfilled');
    });

    it('should succeed when the event values match expectations', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        process.nextTick(function () {
            ev.emit('foo', 'bar', 'baz');
        });

        return expect(
            expect(ev, 'for the event values on', 'foo', 'to equal', 'bar', 'baz')
        , 'to be fulfilled');
    });

    it('should ignore subsequent events on the specified channel', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        process.nextTick(function () {
            ev.emit('foo', 'foo');
            ev.emit('foo', 'bar');
        });

        return expect(
            expect(ev, 'for the event on', 'foo', 'to equal', ['foo'])
        , 'to be fulfilled');
    });

    it('should succeed comparing the first event', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        process.nextTick(function () {
            ev.emit('foo', 'quux');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', ['quux'])
        , 'to be fulfilled');
    });

    it('should succeed comparing the second event', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        process.nextTick(function () {
            ev.emit('foo', 'quux');
            ev.emit('foo', 'xuuq');
        });

        return expect(
            expect(ev, 'for the second event on', 'foo', 'to equal', ['xuuq'])
        , 'to be fulfilled');
    });

    it('should succeed comparing the third event', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        process.nextTick(function () {
            ev.emit('foo', 'bar');
            ev.emit('foo', 'baz');
            ev.emit('foo', 'quux');
        });

        return expect(
            expect(ev, 'for the third event on', 'foo', 'to equal', ['quux'])
        , 'to be fulfilled');
    });

    describe('multiple events on channel', function () {
        it('should succeed comparing multiple events', function () {
            var ev = new EventEmitter();

            // issue the message after the timeout
            process.nextTick(function () {
                ev.emit('foo', 'bar');
                ev.emit('foo', 'quux');
                ev.emit('foo', 'baz');
            });

            return expect(
                expect(ev, 'for multiple events on', 'foo', 'to equal', [
                    { args: ['bar'] },
                    { args: ['quux'] },
                    { args: ['baz'] }
                ])
            , 'to be fulfilled');
        });

        it('should handle an empty input event list', function () {
            var ev = new EventEmitter();

            return expect(
                expect(ev, 'for multiple events on', 'foo', 'to equal', [])
            , 'to be fulfilled');
        });

        it('should fail comparing multiple events that do not match', function () {
            var ev = new EventEmitter();

            // issue the message after the timeout
            process.nextTick(function () {
                ev.emit('foo', 'bar');
                ev.emit('foo', 'foo');
                ev.emit('foo', 'baz');
            });

            return expect(
                expect(ev, 'for multiple events on', 'foo', 'to equal', [
                    { args: ['bar'] },
                    { args: ['quux'] },
                    { args: ['baz'] }
                ])
            , 'to be rejected');
        });

        it('should fail on an empty event list but a captured event', function () {
            var ev = new EventEmitter();

            setTimeout(function () {
                ev.emit('foo', 'boom');
            }, 1000);

            return expect(
                expect(ev, 'for multiple events on', 'foo', 'to equal', [])
            , 'to be rejected');
        });
    });

    describe('capturing events on channel', function () {
        it('should succeed capturing events on a channel', function () {
            var ev = new EventEmitter();
            var capturedEvent = expect(ev, 'to capture events on', 'foo');
            var inputEvents = [
                ['foo', 'bar', 'biggs'],
                ['foo', 'baz', 'bingo', 'bob'],
                ['foobar', 'hopefully_not'],
                ['foo', 'quux']
            ];
            var expectedEvents = [].concat(inputEvents);
            expectedEvents.splice(2, 1);
            var expectedEventValues = expectedEvents.map(function (event) {
                return event.slice(1);
            });

            return expect.promise(function (resolve, reject) {
                process.nextTick(function () {
                    inputEvents.forEach(function (eventValues) {
                        ev.emit.apply(ev, eventValues);
                    });
                    resolve();
                });
            }).then(function () {
                return capturedEvent;
            }).then(function (outputEvents) {
                expect(outputEvents, 'to be an', unexpectedEvents.UnexpectedEvents);

                var events = outputEvents.events;
                expect(events, 'to have items satisfying', expect.it('to be an', unexpectedEvents.UnexpectedEvent));
                expect(events.map(function (event) { return event.args; }), 'to equal', expectedEventValues);
            });
        });
    });

    describe('UnexpectedEvents', function () {
        it('should error if events were not wrapped', function () {
            expect(function () {
                new unexpectedEvents.UnexpectedEvents([
                    new unexpectedEvents.UnexpectedEvent(['foo']),
                    ['quux'],
                ]);
            }, 'to error', 'Value supplied was not event values array.');
        });

        it('should succeed comparing matching objects', function () {
            var lhs = new unexpectedEvents.UnexpectedEvents([
                new unexpectedEvents.UnexpectedEvent(['foo']),
                new unexpectedEvents.UnexpectedEvent(['bar'])
            ]);
            var rhs = new unexpectedEvents.UnexpectedEvents([
                new unexpectedEvents.UnexpectedEvent(['foo']),
                new unexpectedEvents.UnexpectedEvent(['bar'])
            ]);

            return expect(
                expect(lhs, 'to equal', rhs)
            , 'to be fulfilled');
        });
    });

    describe('"for event"', function () {
        it('should error if the requested event was not present', function () {
            var events = new unexpectedEvents.UnexpectedEvents([
                new unexpectedEvents.UnexpectedEvent(['foo'])
            ]);

            return expect(function () {
                expect(events, 'for event', 2, 'to equal', 'foo');
            }, 'to error', 'Expected event was not seen.');
        });

        it('should allow check for the third event', function () {
            var events = new unexpectedEvents.UnexpectedEvents([
                new unexpectedEvents.UnexpectedEvent(['foo']),
                new unexpectedEvents.UnexpectedEvent(['bar']),
                new unexpectedEvents.UnexpectedEvent(['baz'])
            ]);

            return expect(
                expect(events, 'for event', 3, 'to equal', 'baz')
            , 'to be fulfilled');
        });
    });
});
