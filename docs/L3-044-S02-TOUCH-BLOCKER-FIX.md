# L3-044 S02 — small-screen touch blocker correction

The actual first GitHub Actions workflow run `41754519099` passed clean npm, TypeScript, 8 invalid contract cases, inherited tests, Vite build and manifest, then **failed** in real mobile Chromium. Job `126327375448` showed a Playwright pointer interception: clicking the locked-example button timed out because text in the third stacked notification was covering it. This was a real layout defect, **not** a harness false positive. GitHub failure artifact `13286729319` was downloaded and preserved.

The visual fix changes the toast stack from fixed overlay to a bounded, scrollable notification region in normal document flow below the buttons. Notifications can no longer intercept a demo action in the covered region. Navy/gold and typography remain unchanged. Added a local regression test and a genuine browser assertion comparing the notification region to the action buttons' positions. No changes to fighter art, gameplay, persistence, or earlier components.

S02 is provisional until all fresh GitHub Actions checks including 375/390/402/430 mobile Chromium dev and preview pass. No physical iPhone Safari test is claimed; owner defers it to around task 136. No deployment or L3-045.
