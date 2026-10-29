import type { ManifestCheckId, ManifestTask, ManifestVerification, ManifestFile, ManifestTestEvidence, VerifiedBuildManifest } from '../../src/tooling/build-manifest-contract';
const invalidTask:ManifestTask='L3-035';
const invalidResult:ManifestVerification='UNVERIFIED';
const invalidCheck:ManifestCheckId='developer-says-pass';
const invalidFile:ManifestFile={path:'test',bytes:'100',sha256:'a'};
const invalidEvidence:ManifestTestEvidence={id:'unit-tests',command:['npm','test'],exitCode:1,log:'test.log',logBytes:10,logSha256:'x'};
const fakeBuild:VerifiedBuildManifest={format:'LEGACY3_VERIFIED_BUILD_MANIFEST_V1',taskId:'L3-034',projectVersion:'1',buildTool:'webpack',verification:'PASS',knownIssues:[],source:{sha256:'a',files:[]},build:{sha256:'b',files:[]},tests:[]};
void [invalidTask,invalidResult,invalidCheck,invalidFile,invalidEvidence,fakeBuild];
