import {openDetail,rewindDetail,detailsForParent,type NestedDetailId,type NestedState,type DetailTrail} from '../../src/ui/nested-nav-contract';
const badId:NestedDetailId='career-contracts';
const badRoute:NestedState={arena:{entries:[null],cursor:0}};
const mutableTrail:DetailTrail={entries:['totally-unknown'],cursor:0};
openDetail({},'career','other-nonexistent-detail');
rewindDetail({},'invalid',null);
detailsForParent('fight','incorrect-parent');
const badNumber:NestedDetailId=5;
void [badId,badRoute,mutableTrail,badNumber];
