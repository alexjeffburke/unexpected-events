function assertEvent(expect, subject, channel, responseCount) {
    return expect.promise(function (resolve, reject) {
        function unexpectedEventListener() {
            responseCount -= 1;

            if (responseCount > 0) {
                return;
            }

            // unhook event on success
            subject.removeListener(channel, unexpectedEventListener);

            resolve(Array.prototype.slice.call(arguments, 0));
        }

        setTimeout(function () {
            subject.removeListener(channel, unexpectedEventListener);

            reject(new Error('No event seen prior to timeout.'));
        }, 1950);

        subject.on(channel, unexpectedEventListener);
    }).then(function (message) {
        // if the values flag was set do a varargs comparison
        if (expect.flags.values) {
            return assertEventResponseUsingVarargs(expect, message);
        }

        return expect.promise(function () {
            var suppliedArgs = expect.args;
            var suppliedValue = suppliedArgs[suppliedArgs.length - 1];

            if (!validateArrayArgument(suppliedArgs, suppliedValue)) {
                throw new Error('Value supplied was not event values array.');
            }

            return expect.shift(message);
        });
    });
}

function assertEventResponseUsingVarargs(expect, eventValues) {
    return expect.promise(function (resolve, reject) {
        var suppliedArgs = expect.args;
        var combinationsOfArgs = [];
        var tmp;

        do {
            tmp = suppliedArgs.slice(0, 3);
            combinationsOfArgs.push(tmp);
            suppliedArgs.splice(2, 1);
        } while (suppliedArgs.length > 2);

        if (eventValues.length > combinationsOfArgs.length) {
            reject(new Error('Message was longer than expected definition.'));
        } else if (combinationsOfArgs.length > eventValues.length) {
            reject(new Error('Message was shorter than expected definition.'));
        }

        var argsPromises = combinationsOfArgs.map(function (args) {
            // take an individual value to assert
            var eventValue = eventValues.shift();

            return expect.promise(function () {
                expect.args = args;

                // execute the requested assertion against the value
                return expect.shift(eventValue);
            });
        });

        return expect.promise.all(argsPromises).caught(reject).then(resolve);
    });
}

function assertMultipleEvents(expect, subject, channel) {
    return expect.promise(function (resolve, reject) {
        var suppliedArgs = expect.args;
        var expectedEvents = suppliedArgs[suppliedArgs.length - 1];

        if (!validateArrayArgument(suppliedArgs, expectedEvents)) {
            return reject(new Error('An array of events is expected.'));
        }

        if (!validateEventValues(expectedEvents)) {
            return reject(new Error('Each event must be specified as an array.'));
        }

        var responseCount = expectedEvents.length;
        var seenEvents = [];

        function unexpectedEventListener() {
            responseCount -= 1;

            seenEvents.push(Array.prototype.slice.call(arguments, 0));

            if (responseCount === 0) {
                // unhook event on success
                subject.removeListener(channel, unexpectedEventListener);

                resolve([seenEvents]);
            }
        }

        setTimeout(function () {
            subject.removeListener(channel, unexpectedEventListener);

            reject(new Error('Timeout fired with events missing.'));
        }, 1950);

        subject.on(channel, unexpectedEventListener);
    }).spread(function (seenEvents) {
        return expect.promise(function () {
            return expect.shift(seenEvents);
        });
    });
}

function isArray(x) {
    return (Object.prototype.toString.call(x) === '[object Array]');
}

function isFunction(x) {
    return (typeof x === 'function');
}

function validateArrayArgument(suppliedArgs, suppliedValue) {
    return (suppliedArgs.length == 3 && isArray(suppliedValue));
}

function validateEventValues(expectedEvents) {
    var notArrays = expectedEvents.filter(function (x) { return !isArray(x); });

    return (notArrays.length === 0);
}

module.exports = {
    name: 'unexpected-events',
    version: require('../package.json').version,
    installInto: function (expect) {
        expect.addType({
            base: 'any',
            name: 'EventEmitter',
            identify: function (obj) {
                return (typeof obj === 'object' && obj !== null && isFunction(obj.emit) && isFunction(obj.on));
            }
        });

        expect.addAssertion('<EventEmitter> for the first event [values] on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 1);
        });

        expect.addAssertion('<EventEmitter> for the second event [values] on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 2);
        });

        expect.addAssertion('<EventEmitter> for the third event [values] on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 3);
        });

        expect.addAssertion('<EventEmitter> for the multiple events on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertMultipleEvents(expect, subject, channel);
        });
    }
};
