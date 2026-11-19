import {test,expect} from 'bun:test';
import {readLaunch,playerName} from '../../src/lib/backend/launch';
test('normal links, lowercase codes, and launch names are parsed without adopting external identities',()=>{
 expect(readLaunch('?game=abcdef12')).toEqual({mode:null,table:'ABCDEF12',name:''});
 expect(readLaunch('?table=ABCDEF12&launch=join&name=%20Alex%20&uid=somebody')).toEqual({mode:'join',table:'ABCDEF12',name:'Alex'});
 expect(readLaunch('?table=ABCDEF12&launch=create&name=Alex').mode).toBe('create');
 expect(playerName('  Alex  ')).toBe('Alex');expect(playerName('a'.repeat(30))).toHaveLength(24);
 for(const search of ['?game=bad','?launch=wrong','?launch=create&table=ABCDEF12','?launch=join&table=invalid&name=Alex'])expect(()=>readLaunch(search)).toThrow();
});
