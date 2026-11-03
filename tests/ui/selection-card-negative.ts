/** Exactly seven intentional TypeScript violations for the L3-042 public API. */
import type {SelectionCardOption,SelectionCardProps,SelectionIllustration} from '../../src/ui/selection-card-contract';
const invalidIllustration:SelectionIllustration='mannequin';
const missingLabel:SelectionCardOption={id:'a',description:'desc',illustration:'striking'};
const numericId:SelectionCardOption={id:13,label:'Choice',description:'desc',illustration:'grappling'};
const invalidDisabled:SelectionCardOption={id:'a',label:'A',description:'B',illustration:'balanced',disabled:'yes'};
const missingOptions:SelectionCardProps={title:'No choices'};
const wrongCallback:SelectionCardProps={title:'Choices',options:[],onSelect:(id:number)=>console.log(id)};
const badInitial:SelectionCardProps={title:'Choices',options:[],initialSelectedId:12};
void [invalidIllustration,missingLabel,numericId,invalidDisabled,missingOptions,wrongCallback,badInitial];
