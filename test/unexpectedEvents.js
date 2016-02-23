var EventEmitter = require('events').EventEmitter;
var expect = require('unexpected');

describe('unexpected-events', function () {
    expect = expect.clone();
    expect.installPlugin(require('../lib/unexpectedEvents'));

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
});
