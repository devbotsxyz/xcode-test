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


const path = require('path');
const fs = require('fs');

const core = require('@actions/core');
const artifact = require('@actions/artifact');
const execa = require('execa');

const { getOptionalInput, getOptionalBooleanInput, getOptionalYesNoInput } = require('@devbotsxyz/inputs');
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


const testProject = async ({workspace, project, scheme, configuration, sdk, arch, destination, disableCodeSigning, codeSignIdentity, codeSigningRequired, codeSignEntitlements, codeSigningAllowed, developmentTeam, constraints, language, region, clean, resultBundlePath}) => {
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

    // Test Specific Options

    let testOptions = []

    if (constraints !== "") {
        testOptions = [...testOptions, ...constraints];
    }

    if (language !== "") {
        testOptions = [...testOptions, '-testLanguage', language];
    }

    if (region !== "") {
        testOptions = [...testOptions, '-testRegion', region];
    }

    if (resultBundlePath !== undefined) {
        testOptions = [...testOptions, '-resultBundlePath', resultBundlePath];
    }

    // Build Settings

    let buildSettings = []

    if (disableCodeSigning === true) {
        buildSettings.push('CODE_SIGN_IDENTITY=""');
        buildSettings.push('CODE_SIGNING_REQUIRED="NO"');
        buildSettings.push('CODE_SIGN_ENTITLEMENTS=""');
        buildSettings.push('CODE_SIGNING_ALLOWED="NO"');
    } else {
        if (codeSignIdentity !== undefined) {
            buildSettings.push(`CODE_SIGN_IDENTITY=${codeSignIdentity}`);
        }
        if (codeSigningRequired !== undefined) {
            buildSettings.push(`CODE_SIGNING_REQUIRED=${codeSigningRequired ? 'YES' : 'NO'}`);
        }
        if (codeSignEntitlements !== undefined) {
            buildSettings.push(`CODE_SIGN_ENTITLEMENTS=${codeSignEntitlements}`);
        }
        if (codeSigningAllowed !== undefined) {
            buildSettings.push(`CODE_SIGNING_ALLOWED=${codeSigningAllowed ? 'YES' : 'NO'}`);
        }
    }

    if (developmentTeam !== undefined) {
        buildSettings.push(`DEVELOPMENT_TEAM=${developmentTeam}`);
    }

    let command = ['test']
    if (clean === true) {
        command = ['clean', ...command]
    }

    console.log("EXECUTING:", 'xcodebuild', [...options, ...command, ...testOptions, ...buildSettings]);

    const xcodebuild = execa('xcodebuild', [...options, ...command, ...testOptions, ...buildSettings], {
        reject: false,
        env: {"NSUnbufferedIO": "YES"},
    });

    xcodebuild.stdout.pipe(process.stdout);
    xcodebuild.stderr.pipe(process.stderr);

    let {exitCode} = await xcodebuild;
    if (exitCode != 0) { // TODO What about exit status 65?
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
        clean: getOptionalBooleanInput("clean"),
        disableCodeSigning: getOptionalBooleanInput('disable-code-signing'),
        codeSignIdentity: getOptionalInput('CODE_SIGN_IDENTITY'),
        codeSigningRequired: getOptionalYesNoInput('CODE_SIGNING_REQUIRED'),
        codeSignEntitlements: getOptionalInput('CODE_SIGN_ENTITLEMENTS'),
        codeSigningAllowed: getOptionalYesNoInput('CODE_SIGNING_ALLOWED'),
        developmentTeam: getOptionalInput('development-team'),
        constraints: parseConstraints(core.getInput('constraints')),
        language: "",
        region: "",
        resultBundlePath: getOptionalInput("result-bundle-path"),
        resultBundleName: getOptionalInput("result-bundle-name"),
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

    // TODO Validate the resultBundlePath

    return configuration;
}


const archiveResultBundle = async (resultBundlePath) => {
    const archivePath = resultBundlePath + ".zip";

    const args = [
        "-c",             // Create an archive at the destination path
        "-k",             // Create a PKZip archive
        "--keepParent",   // Embed the parent directory name src in dst_archive.
        resultBundlePath, // Source
        archivePath,      // Destination
    ];

    try {
        await execa("ditto", args);
    } catch (error) {
        core.error(error);
        return null;
    }

    return archivePath;
};


const uploadResultBundleArtifact = async (resultBundleArchivePath, resultBundleName) => {
    const artifactClient = artifact.create()
    const uploadResult = await artifactClient.uploadArtifact(
        resultBundleName,
        [resultBundleArchivePath],
        path.dirname(resultBundleArchivePath)
    )
};


const main = async () => {
    try {
        const configuration = await parseConfiguration();

        // Run xcodebuild test
        await testProject(configuration);

        // Upload the results bundle as an artifact
        if (configuration.resultBundlePath !== "" && fs.existsSync(configuration.resultBundlePath)) {
            const resultBundleArchivePath = await archiveResultBundle(configuration.resultBundlePath);
            await uploadResultBundleArtifact(resultBundleArchivePath, configuration.resultBundleName);
        }
    } catch (err) {
        core.setFailed(`Testing failed with an unexpected error: ${err.message}`);
    }
};


main();
