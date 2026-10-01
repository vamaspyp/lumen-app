import {getGreenfieldSupabase} from '../adapters/supabase/client'

export type MovementFact={event_id:string;help_id:string|null;at:string;text:string}
export type MovementSnapshot={state:'success'|'without_memory';items:MovementFact[];changes:MovementFact[];context:{adjustable?:string;external?:string;potential?:string};withdrawn:boolean}
export type ExperienceResume={state:'success'|'empty'|'without_memory';episode_id?:string;moment_id?:string;help_id?:string;position?:{step:number;finished:boolean}}
async function call<T>(name:string,args?:Record<string,unknown>):Promise<T>{const {data,error}=await getGreenfieldSupabase().rpc(name,args);if(error)throw new Error(error.message);return data as T}
export const getMovement=()=>call<MovementSnapshot>('lumen_s2_movement_snapshot')
export const setLifeContext=(adjustable:string,external:string,potential:string)=>call('lumen_s2_set_life_context',{p_adjustable:adjustable,p_external:external,p_potential:potential})
export const forgetPersonalMemory=()=>call('lumen_privacy_forget_personal_memory',{p_confirm:true})
export const getExperienceResume=()=>call<ExperienceResume>('lumen_s2_resume_experience')
export const saveExperiencePosition=(episodeId:string,step:number,finished=false)=>call<{state:string}>('lumen_s2_save_experience_position',{p_episode_id:episodeId,p_step:step,p_finished:finished})

export const correctMomentContext=(episodeId:string,minutes:number)=>call('lumen_s1_correct_moment_context',{p_episode_id:episodeId,p_available_minutes:minutes})
