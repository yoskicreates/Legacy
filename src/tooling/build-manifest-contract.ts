/** L3-034 compile-time contract for emitted auditable manifests. */
export type ManifestFormat = 'LEGACY3_VERIFIED_BUILD_MANIFEST_V1';
export type ManifestTask = 'L3-034';
export type ManifestVerification = 'PASS';
export type Sha256Hex = string & {readonly __sha256: unique symbol};
export interface ManifestFile {readonly path:string;readonly bytes:number;readonly sha256:string}
export interface ManifestFileInventory {readonly sha256:string;readonly files:readonly ManifestFile[]}
export type ManifestCheckId = 'lint'|'domain-boundaries'|'typescript-strict'|'negative-type-tests'|'fixture-negative-tests'|'unit-tests'|'vite-production-build';
export interface ManifestTestEvidence {readonly id:ManifestCheckId;readonly command:readonly string[];readonly exitCode:0;readonly log:string;readonly logBytes:number;readonly logSha256:string}
export interface VerifiedBuildManifest {readonly format:ManifestFormat;readonly taskId:ManifestTask;readonly projectVersion:string;readonly buildTool:'vite';readonly verification:ManifestVerification;readonly knownIssues:readonly string[];readonly source:ManifestFileInventory;readonly build:ManifestFileInventory;readonly tests:readonly ManifestTestEvidence[]}
