function UnexpectedEvent(eventArgs) {
    this.args = eventArgs;
}

function UnexpectedEvents(seenEvents) {
    this.events = seenEvents;

    seenEvents.forEach(function (seenEvent) {
        if (!(seenEvent instanceof UnexpectedEvent)) {
            throw new Error('Value supplied was not event values array.');
        }
    });
}

function acquireEvent(expect, subject, channel, responseCount) {
    return expect.promise(function (resolve, reject) {
        var listenerCleanupFn;
        var listenerTimeout;
        var seenEvents = [];
        var suppliedCount = responseCount;

        function resolveWithEvents(seenEvents) {
            if (listenerCleanupFn) listenerCleanupFn();

            resolve([new UnexpectedEvents(seenEvents)]);
        }

        listenerCleanupFn = attachEventListener(expect, subject, channel, function (currentEvent) {
            seenEvents.push(currentEvent);

            responseCount -= 1;

            if (responseCount === 0) {
                if (listenerTimeout) clearTimeout(listenerTimeout);

                resolveWithEvents(seenEvents);
            }
        });

        var originalStack = new Error().stack;

        listenerTimeout = setTimeout(function () {
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
    });
}

function acquireAndAssertEvent(expect, subject, channel, responseCount) {
    return acquireEvent(expect, subject, channel, responseCount).spread(function (theEvents) {
        // single event assertions check the *last* seen event
        var seenEvent = theEvents.events[theEvents.events.length - 1];

        // if the values flag was set do a varargs comparison
        if (expect.flags.values) {
            return assertEventUsingVarargs(expect, seenEvent, expect.args.slice(1));
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

function assertEvent(expect, seenEvents, eventIndex) {
    var seenEventsCount = seenEvents.events.length;

    if (eventIndex >= seenEventsCount) {
        return expect.promise.reject(new Error('Expected event was not seen.'));
    }

    var seenEvent = seenEvents.events[eventIndex];
    var combineArgs = expect.args.slice(1);

    return assertEventUsingVarargs(expect, seenEvent, combineArgs);
}

function assertEventUsingVarargs(expect, seenEvent, combineArgs) {
    // unpack the UnexpectedEvent object back to its underlying event args
    var eventValues = seenEvent.args;

    return expect.promise(function (resolve, reject) {
        var suppliedArgs = combineArgs.slice(0);
        var combinationsOfArgs = [];
        var tmp;

        do {
            tmp = suppliedArgs.slice(0, 2);
            combinationsOfArgs.push(tmp);
            suppliedArgs.splice(1, 1);
        } while (suppliedArgs.length > 1);

        if (eventValues.length > combinationsOfArgs.length) {
            reject(new Error('Message was longer than expected definition.'));
        } else if (combinationsOfArgs.length > eventValues.length) {
            reject(new Error('Message was shorter than expected definition.'));
        }

        var argsPromises = combinationsOfArgs.map(function (args) {
            // take an individual value to assert
            var eventValue = eventValues.shift();

            // execute the requested assertion against the value
            return expect(eventValue, args[0], args[1]);
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

        return acquireEvent(expect, subject, channel, responseCount).then(resolve).catch(reject);
    }).spread(function (theEvents) {
        var seenEvents = theEvents.events;

        return expect.promise(function () {
            return expect.shift(seenEvents);
        });
    });
}

function attachEventListener(expect, subject, channel, onEvent) {
    function unexpectedEventListener() {
        var eventValues = Array.prototype.slice.call(arguments, 0);

        onEvent(new UnexpectedEvent(eventValues));
    }

    subject.on(channel, unexpectedEventListener);

    return function removeEventListener() {
        subject.removeListener(channel, unexpectedEventListener);
    };
}

function captureEvents(expect, subject, channel) {
    var seenEvents = [];

    attachEventListener(expect, subject, channel, function (event) {
        seenEvents.push(event);
    });

    return expect.promise.resolve(new UnexpectedEvents(seenEvents));
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

        expect.addType({
            base: 'any',
            name: 'UnexpectedEvents',
            identify: function (obj) {
                return (isObject(obj) && obj instanceof UnexpectedEvents);
            },
            inspect: function (subject, depth, output, inspect) {
                output.text(inspect(subject.events, depth));
            },
            equal: function (a, b, equal) {
                return equal(a.events, b.events);
            }
        });

        expect.addAssertion('<EventEmitter> for the (|first) event [values] on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return acquireAndAssertEvent(expect, subject, channel, 1);
        });

        expect.addAssertion('<EventEmitter> for the second event [values] on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return acquireAndAssertEvent(expect, subject, channel, 2);
        });

        expect.addAssertion('<EventEmitter> for the third event [values] on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return acquireAndAssertEvent(expect, subject, channel, 3);
        });

        expect.addAssertion('<EventEmitter> for multiple events on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertMultipleEvents(expect, subject, channel);
        });

        expect.addAssertion('<EventEmitter> to capture events on <string>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return captureEvents(expect, subject, channel);
        });

        expect.addAssertion('<UnexpectedEvents> for event <number> <assertion>', function (expect, subject, eventNumber) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, eventNumber - 1);
        });
    },
    UnexpectedEvent: UnexpectedEvent,
    UnexpectedEvents: UnexpectedEvents
};
