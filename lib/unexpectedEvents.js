function UnexpectedEvent(eventArgs) {
    this.args = eventArgs;
}

function acquireEvent(expect, subject, channel, responseCount) {
    return expect.promise(function (resolve, reject) {
        var listenerTimeout;
        var seenEvents = [];
        var suppliedCount = responseCount;

        function resolveWithEvents(seenEvents) {
            var wrappedSeenEvents = seenEvents.map(function (seenEvent) {
                return new UnexpectedEvent(seenEvent);
            });

            resolve([wrappedSeenEvents]);
        }

        function unexpectedEventListener() {
            responseCount -= 1;

            seenEvents.push(Array.prototype.slice.call(arguments, 0));

            if (responseCount === 0) {
                if (listenerTimeout) clearTimeout(listenerTimeout);

                // unhook event on success
                subject.removeListener(channel, unexpectedEventListener);

                resolveWithEvents(seenEvents);
            }
        }

        var originalStack = new Error().stack;

        listenerTimeout = setTimeout(function () {
            subject.removeListener(channel, unexpectedEventListener);

            if (suppliedCount === 0) {
                if (seenEvents.length === 0) {
                    resolveWithEvents(seenEvents);
                } else {
                    reject(new Error('Saw unexpected events.'));
                }
            } else {
                var error = new Error('Expected event not seen prior to timeout.');
                error.stack = originalStack;
                reject(error);
            }
        }, 1950);

        subject.on(channel, unexpectedEventListener);
    });
}

function assertEvent(expect, subject, channel, responseCount) {
    return acquireEvent(expect, subject, channel, responseCount).spread(function (seenEvents) {
        // single event assertions check the *last* seen event
        var seenEvent = seenEvents.pop();

        // if the values flag was set do a varargs comparison
        if (expect.flags.values) {
            return assertEventUsingVarargs(expect, seenEvent);
        }

        return expect.promise(function (resolve, reject) {
            var suppliedArgs = expect.args;
            var suppliedValue = suppliedArgs[suppliedArgs.length - 1];

            if (!validateArrayArgument(suppliedArgs, suppliedValue)) {
                reject(new Error('Value supplied was not event values array.'));
            }

            var expectedEvent = new UnexpectedEvent(suppliedValue);
            setExpectedArgument(expect, expectedEvent);

            resolve(expect.shift(seenEvent));
        });
    });
}

function assertEventUsingVarargs(expect, seenEvent) {
    // unpack the UnexpectedEvent object back to its underlying event args
    var eventValues = seenEvent.args;

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
        var wrappedExpectedEvents = expectedEvents.map(function (eventObject) {
            return new UnexpectedEvent(eventObject.args);
        });

        setExpectedArgument(expect, wrappedExpectedEvents);

        return acquireEvent(expect, subject, channel, responseCount).then(function (seenEvents) {
            resolve(seenEvents);
        }).caught(function (err) {
            reject(err);
        });
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

function isObject(x) {
    return (typeof x === 'object' && x !== null);
}

function setExpectedArgument(expect, argValue) {
    expect.args[2] = argValue;
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
            name: 'UnexpectedEvent',
            identify: function (obj) {
                return (isObject(obj) && obj instanceof UnexpectedEvent);
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
