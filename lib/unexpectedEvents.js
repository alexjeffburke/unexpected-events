function acquireEvent(expect, subject, channel, responseCount) {
    return expect.promise(function (resolve, reject) {
        var listenerTimeout;
        var seenEvents = [];

        function unexpectedEventListener() {
            responseCount -= 1;

            seenEvents.push(Array.prototype.slice.call(arguments, 0));

            if (responseCount === 0) {
                if (listenerTimeout) clearTimeout(listenerTimeout);

                // unhook event on success
                subject.removeListener(channel, unexpectedEventListener);

                resolve([seenEvents]);
            }
        }

        listenerTimeout = setTimeout(function () {
            subject.removeListener(channel, unexpectedEventListener);

            reject(new Error('Expected event not seen prior to timeout.'));
        }, 1950);

        subject.on(channel, unexpectedEventListener);
    });
}

function assertEvent(expect, subject, channel, responseCount) {
    return acquireEvent(expect, subject, channel, responseCount).spread(function (seenEvents) {
        // single event assertions check the *last* seen event
        var eventValues = seenEvents.pop();

        // if the values flag was set do a varargs comparison
        if (expect.flags.values) {
            return assertEventUsingVarargs(expect, eventValues);
        }

        return expect.promise(function (resolve, reject) {
            var suppliedArgs = expect.args;
            var suppliedValue = suppliedArgs[suppliedArgs.length - 1];

            if (!validateArrayArgument(suppliedArgs, suppliedValue)) {
                reject(new Error('Value supplied was not event values array.'));
            }

            resolve(expect.shift(eventValues));
        });
    });
}

function assertEventUsingVarargs(expect, eventValues) {
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

        resolve(acquireEvent(expect, subject, channel, responseCount));
    }).spread(function (seenEvents) {
        var wrappedSeenEvents = seenEvents.map(function (eventArgs) {
            return { args: eventArgs };
        });

        return expect.promise(function () {
            return expect.shift(wrappedSeenEvents);
        });
    });
}

function isArray(x) {
    return (Object.prototype.toString.call(x) === '[object Array]');
}

function isFunction(x) {
    return (typeof x === 'function');
}

function isObject(x) {
    return (typeof x === 'object' && x !== null);
}

function validateArrayArgument(suppliedArgs, suppliedValue) {
    return (suppliedArgs.length == 3 && isArray(suppliedValue));
}

function validateEventValues(expectedEvents) {
    var invalidValues = expectedEvents.filter(function (x) { return !(isObject(x) && isArray(x.args)); });

    return (invalidValues.length === 0);
}

module.exports = {
    name: 'unexpected-events',
    version: require('../package.json').version,
    installInto: function (expect) {
        expect.addType({
            base: 'any',
            name: 'EventEmitter',
            identify: function (obj) {
                return (isObject(obj) && isFunction(obj.emit) && isFunction(obj.on));
            },
            inspect: function (subject, depth, output, inspect) {
                output.text('EventEmitter');
            }
        });

        expect.addType({
            base: 'any',
            name: 'Event',
            identify: function (obj) {
                return (isObject(obj) && isArray(obj.args));
            },
            inspect: function (subject, depth, output, inspect) {
                output.text(inspect(subject.args, depth));
            },
            equal: function (a, b, equal) {
                return equal(a.args, b.args);
            }
        });

        expect.addAssertion('<EventEmitter> for the (|first) event [values] on <string> <assertion>', function (expect, subject, channel) {
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

        expect.addAssertion('<EventEmitter> for multiple events on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertMultipleEvents(expect, subject, channel);
        });
    }
};
