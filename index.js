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


const core = require('@actions/core');
const execa = require('execa');

const parseConstraints = require('./constraints');
const { parseDestination, encodeDestinationOption } = require('./destinations');


const getProjectInfo = async ({workspace, project}) => {
    const options = [];
    if (workspace != "") {
        options.push("-workspace", workspace);
    }
    if (project != "") {
        options.push("-project", project);
    }

    const xcodebuild = execa('xcodebuild', [...options, '-list', '-json']);
    const {stdout} = await xcodebuild;

    return JSON.parse(stdout);
};


const testProject = async ({workspace, project, scheme, configuration, sdk, arch, destination, codeSignIdentity, developmentTeam, constraints = [], language = "", region = ""} = {}) => {
    let options = []
    if (workspace != "") {
        options.push("-workspace", workspace);
    }
    if (project != "") {
        options.push("-project", project);
    }
    if (scheme != "") {
        options.push("-scheme", scheme);
    }
    if (configuration != "") {
        options.push("-configuration", configuration);
    }
    if (destination != "") {
        options.push("-destination", encodeDestinationOption(destination) );
    }
    if (sdk != "") {
        options.push("-sdk", sdk);
    }
    if (arch != "") {
        options.push("-arch", arch);
    }

    let buildOptions = []
    if (codeSignIdentity != "") {
        buildOptions.push(`CODE_SIGN_IDENTITY=${codeSignIdentity}`);
    }
    if (developmentTeam != "") {
        buildOptions.push(`DEVELOPMENT_TEAM=${developmentTeam}`);
    }

    let testOptions = []
    if (constraints != []) {
        testOptions = [...testOptions, ...constraints];
    }

    if (language != "") {
        testOptions = [...testOptions, '-testLanguage', language];
    }

    if (region != "") {
        testOptions = [...testOptions, '-testRegion', region];
    }

    console.log("EXECUTING:", 'xcodebuild', [...options, 'build', ...buildOptions]);

    const xcodebuild = execa('xcodebuild', [...options, 'test', ...testOptions, ...buildOptions], {
        reject: false,
        env: {"NSUnbufferedIO": "YES"},
    });

    xcodebuild.stdout.pipe(process.stdout);
    xcodebuild.stderr.pipe(process.stderr);

    let {exitCode} = await xcodebuild;
    if (exitCode != 0 && exitCode != 65) {
        throw Error(`xcodebuild test failed with unexpected exit code ${exitCode}`);
    }
};


const parseConfiguration = async () => {
    const configuration = {
        workspace: core.getInput("workspace"),
        project: core.getInput("project"),
        scheme: core.getInput("scheme"),
        configuration: core.getInput("configuration"),
        sdk: core.getInput("sdk"),
        arch: core.getInput("arch"),
        destination: core.getInput("destination"),
        codeSignIdentity: core.getInput('code-sign-identity'),
        developmentTeam: core.getInput('development-team'),
        constraints: parseConstraints(core.getInput('constraints')),
        language: "",
        region: "",
    };

    if (configuration.destination !== "") {
        configuration.destination = parseDestination(configuration.destination);
    }

    if (configuration.scheme === "") {
        const projectInfo = await getProjectInfo(configuration);
        if (configuration.scheme === "") {
            configuration.scheme = projectInfo.project.schemes[0];
        }
    }

    const locale = core.getInput('locale');
    if (locale !== "") {
        const [language, region] = locale.split("_");
        configuration.language = language;
        configuration.region = region;
    } else {
        configuration.language = core.getInput('language');
        configuration.region = core.getInput('region');
    }

    return configuration;
}


const main = async () => {
    try {
        const configuration = await parseConfiguration();
        await testProject(configuration);
    } catch (err) {
        core.setFailed(`Testing failed with an unexpected error: ${err.message}`);
    }
};


main();
