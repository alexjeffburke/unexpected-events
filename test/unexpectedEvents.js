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

    it('should error on a null value', function () {
        var ev = new EventEmitter();

        process.nextTick(function () {
            ev.emit('foo', 'bar');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', null)
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
        , 'to be rejected with', 'No event seen prior to timeout.');
    });

    it('should succeed when the event matches expectations', function () {
        var ev = new EventEmitter();

        // issue the message after the timeout
        process.nextTick(function () {
            ev.emit('foo', 'bar', 'baz');
        });

        return expect(
            expect(ev, 'for the first event on', 'foo', 'to equal', ['bar', 'baz'])
        , 'to be fulfilled');
    });
});
