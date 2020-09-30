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


const parseConstraints = require('./constraints');


test('parses empty constraints', async () => {
    let constraints = parseConstraints("");
    expect(constraints).toEqual([]);
})


test('parses single constraint', async () => {
    let constraints = parseConstraints("only-testing:HelloMacTests");
    expect(constraints).toEqual([
        "-only-testing:HelloMacTests"
    ]);
});


test('parses comma separated constraint', async () => {
    let constraints = parseConstraints("only-testing:HelloMacTests,skip-testing:HelloMacTests/HelloMacTests/testOnePlusOneIsThree");
    expect(constraints).toEqual([
        "-only-testing:HelloMacTests",
        "-skip-testing:HelloMacTests/HelloMacTests/testOnePlusOneIsThree"
    ]);
});


test('parses line separated constraint', async () => {
    let constraints = parseConstraints("only-testing:HelloMacTests\nskip-testing:HelloMacTests/HelloMacTests/testOnePlusOneIsThree");
    expect(constraints).toEqual([
        "-only-testing:HelloMacTests",
        "-skip-testing:HelloMacTests/HelloMacTests/testOnePlusOneIsThree"
    ]);
});


test('parses line and comma separated constraint', async () => {
    let constraints = parseConstraints("only-testing:HelloMacTests,only-testing:FooMacTests\nskip-testing:HelloMacTests/HelloMacTests/testOnePlusOneIsThree");
    expect(constraints).toEqual([
        "-only-testing:HelloMacTests",
        "-only-testing:FooMacTests",
        "-skip-testing:HelloMacTests/HelloMacTests/testOnePlusOneIsThree"
    ]);
});
