import type { ManifestCheckId, ManifestTask, ManifestVerification, VerifiedBuildManifest } from './build-manifest-contract';
const task: ManifestTask='L3-034';
const verification: ManifestVerification='PASS';
const check: ManifestCheckId='unit-tests';
const manifest: VerifiedBuildManifest={
  format:'LEGACY3_VERIFIED_BUILD_MANIFEST_V1',taskId:task,projectVersion:'0.0.0',buildTool:'vite',verification,
  knownIssues:[],source:{sha256:'a',files:[]},build:{sha256:'b',files:[]},
  tests:[{id:check,command:['npm','test'],exitCode:0,log:'l3-034-evidence/unit-tests.log',logBytes:12,logSha256:'c'}]
};
void manifest;
