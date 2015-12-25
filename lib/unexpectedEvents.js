function assertEvent(expect, subject, channel, responseCount) {
    return expect.promise(function (resolve, reject) {
        if (!(subject.on && subject.emit)) {
            return reject(new Error('The subject provided was not an event emitter.'));
        }

        subject.on(channel, function () {
            responseCount -= 1;

            if (responseCount > 0) {
                return;
            }

            resolve(Array.prototype.slice.call(arguments, 0));
        });
    }).then(function (message) {
        return expect.promise(function () {
            return expect.shift(message);
        });
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
                return (isFunction(obj.emit) && isFunction(obj.on));
            }
        });

        expect.addAssertion('<EventEmitter> for the first response on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 1);
        });

        expect.addAssertion('<EventEmitter> for the second response on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 2);
        });

        expect.addAssertion('<EventEmitter> for the third response on <string> <assertion>', function (expect, subject, channel) {
            expect.errorMode = 'nested';

            return assertEvent(expect, subject, channel, 3);
        });
    }
};
