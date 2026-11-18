import {initializeApp,getApps} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInAnonymously} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
import config from './firebase-config.json';
let connection:ReturnType<typeof connect>|undefined;
async function connect(){const app=getApps()[0]??initializeApp(import.meta.env.VITE_USE_FIREBASE_EMULATORS==='true'?{...config,apiKey:'demo-key',projectId:'demo-hellsbells',appId:'demo-app'}:config);const auth=getAuth(app),db=getFirestore(app);if(import.meta.env.VITE_USE_FIREBASE_EMULATORS==='true'){connectAuthEmulator(auth,'http://127.0.0.1:19297',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',18297);}await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);return {auth,db,uid:auth.currentUser!.uid};}
export function connectFirebase(){return connection??=connect().catch(error=>{connection=undefined;throw error;});}
