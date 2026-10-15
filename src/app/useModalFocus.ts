import {useEffect,useRef} from 'react'

/** Keep keyboard focus in the active dialog and restore the invoking control. */
export function useModalFocus(active:boolean,onEscape:()=>void){
 const escape=useRef(onEscape)
 useEffect(()=>{escape.current=onEscape},[onEscape])
 useEffect(()=>{if(!active)return;const previous=document.activeElement as HTMLElement|null;const dialogs=document.querySelectorAll<HTMLElement>('[role="dialog"],[role="alertdialog"]');const dialog=dialogs[dialogs.length-1];if(!dialog)return;const controls=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(el=>el.getClientRects().length>0);controls()[0]?.focus();const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();escape.current();return}if(event.key!=='Tab')return;const elements=controls(),first=elements[0],last=elements[elements.length-1];if(!first)return;if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus()}else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus()}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus()}},[active])
}
