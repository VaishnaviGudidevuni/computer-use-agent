import { HandoffController } from "./controller";

const handoff = new HandoffController();

console.log("Initial state:", handoff.getState());

handoff.requestHandoff("risky_action");

console.log("After handoff:", handoff.getState());

handoff.takeHumanControl();

console.log("Human control:", handoff.getState());

handoff.resumeAgent();

console.log("After resume:", handoff.getState());

handoff.complete();

console.log("Final state:", handoff.getState());