/** Eight deliberately invalid L3-045 fixture contracts. */
import type {DashboardData,DashboardNotice} from '../../src/ui/dashboard-contract';
import {SAMPLE_DASHBOARD} from '../../src/ui/dashboard-contract';
// 1: no real game data may be passed through this preview
const liveSource:DashboardData={...SAMPLE_DASHBOARD,source:'live'};
// 2: numbers are required for demo money
const stringMoney:DashboardData={...SAMPLE_DASHBOARD,cashUsd:'$250'};
// 3: game day must be represented by a string
const numberDate:DashboardData={...SAMPLE_DASHBOARD,gameDate:20270308};
// 4: unknown notification types must be rejected
const invalidAlert:DashboardNotice={id:'x',title:'t',detail:'d',kind:'danger'};
// 5: fighter name must be text
const invalidName:DashboardData={...SAMPLE_DASHBOARD,fighter:{...SAMPLE_DASHBOARD.fighter,name:123}};
// 6: every action requires a label
const missingNext:DashboardData={...SAMPLE_DASHBOARD,nextAction:{description:'x'}};
// 7: messages must be an array, not a number
const invalidNotices:DashboardData={...SAMPLE_DASHBOARD,notifications:4};
// 8: fixtures are immutable
SAMPLE_DASHBOARD.cashUsd=300;
void [liveSource,stringMoney,numberDate,invalidAlert,invalidName,missingNext,invalidNotices];
