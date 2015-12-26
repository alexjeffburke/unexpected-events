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

            if (suppliedArgs.length === 3 && typeof suppliedValue === 'array') {
                throw new Error('The value must be an array of message parts.');
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

function isFunction(x) {
    return (typeof x === 'function');
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
    }
};
