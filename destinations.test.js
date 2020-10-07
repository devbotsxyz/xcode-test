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


const {parseDestination, encodeDestinationOption, parseShowDestinationsOutput} = require('./destinations');


test('parses empty destination', () => {
    expect(() => parseDestination("")).toThrow(undefined);
});

test('parses invalid destination', () => {
    expect(() => parseDestination("cheese")).toThrow(undefined);
});

test('parses option style', () => {
    const destination = parseDestination("platform=iOS Simulator,name=iPhone 11,OS=14.0");
    expect(destination).toEqual(new Map([
        ["platform", "iOS Simulator"],
        ["name", "iPhone 11"],
        ["OS", "14.0"]
    ]));
});

test('parses showdestinations style', () => {
    const destination = parseDestination("{ platform:iOS Simulator, id:7603609F-2903-4A8A-9FFA-F15626F548FD, OS:14.0, name:iPad (7th generation) }");
    expect(destination).toEqual(new Map([
        ["platform", "iOS Simulator"],
        ["id", "7603609F-2903-4A8A-9FFA-F15626F548FD"],
        ["name", "iPad (7th generation)"],
        ["OS", "14.0"]
    ]));
});

// TODO Unclear if the order of maps is preserved .. it seems to be?
test('encode option-style destination', () => {
    const destination = parseDestination("platform=iOS Simulator,name=iPhone 11,OS=14.0");
    const encoded = encodeDestinationOption(destination);
    expect(encoded).toEqual("platform=iOS Simulator,name=iPhone 11,OS=14.0");
})

// TODO Unclear if the order of maps is preserved .. it seems to be?
test('encode showdestination-style destination', () => {
    const destination = parseDestination("{ platform:iOS Simulator, id:7603609F-2903-4A8A-9FFA-F15626F548FD, OS:14.0, name:iPad (7th generation) }");
    const encoded = encodeDestinationOption(destination);
    expect(encoded).toEqual("platform=iOS Simulator,id=7603609F-2903-4A8A-9FFA-F15626F548FD,OS=14.0,name=iPad (7th generation)");
})


const ShowDestinationsOutput = `


Available destinations for the "Landmarks" scheme:
        { platform:iOS Simulator, id:7603609F-2903-4A8A-9FFA-F15626F548FD, OS:14.0, name:iPad (7th generation) }
        { platform:iOS Simulator, id:FD63489E-C67D-47D6-B7AD-1D10CB24A0A9, OS:14.0, name:iPad (8th generation) }
        { platform:iOS Simulator, id:7B99B4CF-163B-4BBA-826E-1BAE176F0F02, OS:14.0, name:iPad Air (3rd generation) }
        { platform:iOS Simulator, id:F2C45523-3E9B-4BDA-8808-286C0944B14E, OS:14.0, name:iPad Air (4th generation) }
        { platform:iOS Simulator, id:2FC37DAF-5317-4D5B-8363-80F95E2B9770, OS:14.0, name:iPad Pro (9.7-inch) }
        { platform:iOS Simulator, id:B7AD85E3-AB31-42B2-9FDA-1A7352AD3031, OS:14.0, name:iPad Pro (11-inch) (2nd generation) }
        { platform:iOS Simulator, id:FB1F7114-3036-43C9-8C1B-05B60EE4627F, OS:14.0, name:iPad Pro (12.9-inch) (4th generation) }
        { platform:iOS Simulator, id:F4EB250A-191D-4F1F-A30C-C6141E8BF705, OS:14.0, name:iPhone 8 }
        { platform:iOS Simulator, id:2AD4BE4A-1647-4606-949E-47755B429E0C, OS:14.0, name:iPhone 8 Plus }
        { platform:iOS Simulator, id:2DDE6D4C-7BB1-4807-962F-AF6A159E95D0, OS:14.0, name:iPhone 11 }
        { platform:iOS Simulator, id:6704FEFE-6F67-4529-8D15-F64654B2F00B, OS:14.0, name:iPhone 11 Pro }
        { platform:iOS Simulator, id:B6918F7A-8C09-46C9-A2E7-DD2F67C2E7D1, OS:14.0, name:iPhone 11 Pro Max }
        { platform:iOS Simulator, id:8DBF2125-68C0-45C2-BFDE-5E9423001BE0, OS:14.0, name:iPhone SE (2nd generation) }
        { platform:iOS Simulator, id:2FE1FB97-C0D3-4A00-B20F-48514CB48BE9, OS:14.0, name:iPod touch (7th generation) }

Ineligible destinations for the "Landmarks" scheme:
        { platform:iOS, id:dvtdevice-DVTiPhonePlaceholder-iphoneos:placeholder, name:Any iOS Device }
        { platform:iOS Simulator, id:dvtdevice-DVTiOSDeviceSimulatorPlaceholder-iphonesimulator:placeholder, name:Any iOS Simulator Device }
`;

test('parsing showdestinations output', () => {
    const destinations = parseShowDestinationsOutput(ShowDestinationsOutput);    
    expect(destinations.length).toEqual(14);
})
