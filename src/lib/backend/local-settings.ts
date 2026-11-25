// Names and room hints are conveniences; privacy settings must not block authentication.
export function readSetting(key:string){try{return localStorage.getItem(key)??'';}catch{return '';}}
export function writeSetting(key:string,value:string){try{localStorage.setItem(key,value);}catch{/* In-memory play still works. */}}
