// Modern fixed-step reference mode, not a claim that S4 had a fixed render tick.
export const SIM_STEP_MS=16;
export const SIM_STEP_SECONDS=SIM_STEP_MS/1000;
export class SimulationClock {
  constructor(){this.accumulatorMs=0;this.ticks=0;}
  clear(){this.accumulatorMs=0;}
  advance(elapsedMs,step){
    if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw Error('Invalid frame duration');
    // Only discard excessive backlog after long stalls/tab suspension.
    this.accumulatorMs+=Math.min(elapsedMs,250);
    while(this.accumulatorMs+1e-8>=SIM_STEP_MS){
      step(SIM_STEP_SECONDS,this.ticks*SIM_STEP_MS);
      this.ticks++;this.accumulatorMs=Math.max(0,this.accumulatorMs-SIM_STEP_MS);
    }
    return this.accumulatorMs/SIM_STEP_MS;
  }
}
