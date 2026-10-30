import { stageProgress, nextStage, previousStage } from "./howData";
it("starts empty and advances one sixth from stage two, filling on stage six", () => {
  expect([1,2,3,4,5,6].map(s => stageProgress(s))).toEqual([0,1/6,2/6,3/6,4/6,1]);
  expect(stageProgress(6, true)).toBe(1);
});
it("advances all six stages in order without exceeding the last stage", () => {
  let stage = 1;
  const visited = [stage];
  for (let i = 0; i < 5; i++) { stage = nextStage(stage); visited.push(stage); }
  expect(visited).toEqual([1,2,3,4,5,6]);
  expect(nextStage(6)).toBe(6);
});
it("goes back from every later stage and stops at stage one", () => {
  expect([2,3,4,5,6].map(previousStage)).toEqual([1,2,3,4,5]);
  expect(previousStage(1)).toBe(1);
});
