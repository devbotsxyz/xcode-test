// MIT License - Copyright (c) 2020 Stefan Arentz <stefan@devbots.xyz>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


const execa = require('execa');


/**
 * Validates a parsed destination. Throws an Error in case the destination is invalid.
 * Makes sure required keys are there and that no other keys are in the map.
 */

const _validateDestination = (destination) => {
    const validKeys = ['id', 'OS', 'platform', 'name'];
    for (const key of destination.keys()) {
        if (!validKeys.includes(key)) {
            throw Error(`Invalid destination: unexpected key <${key}>`);
        }
    }
    return destination;
}

/*
 * Parse a destination specifier into a destination object. It takes either format:
 *  - { platform:iOS Simulator, id:7603609F-2903-4A8A-9FFA-F15626F548FD, OS:14.0, name:iPad (7th generation) }
 *  - platform=iOS Simulator,name=iPhone 11,OS=14.0
 */

const parseDestination = (s) => {
    s = s.trim();
    if (s === "") {
        throw Error(`Invalid destination`);
    }
    if (s.startsWith("{") && s.endsWith("}")) {
        s = s.substring(1, s.length-1);
        return _validateDestination(new Map(s.split(",").map(v => v.trim().split(":"))));
    }
    return _validateDestination(new Map(s.split(",").map(v => v.trim().split("="))));
};

/**
 * Encode a destination object into the format that xcodebuild expects.
 */

const encodeDestinationOption = (destination) => {
    return Array.from(destination).map(v => v[0] + "=" + v[1]).join(",");
};

/**
 * Parse the output of "xcodebuild -showdestinations". Into an array of destination objects.
 */

const parseShowDestinationsOutput = (output) => {
    const matches = output.match(/(?:({[^}]+}))/gm);
    if (!matches) {
        return undefined;
    }

    const destinations = [];
    for (const spec of matches) {
        console.log(spec);
        const destination = parseDestination(spec);
        if (destination.get("id").length == 36) { // TODO This is not good we need a real parser of the output
            destinations.push(destination);
        }
    }
    return destinations;
};


exports.parseDestination = parseDestination;
exports.encodeDestinationOption = encodeDestinationOption;
exports.parseShowDestinationsOutput = parseShowDestinationsOutput;
