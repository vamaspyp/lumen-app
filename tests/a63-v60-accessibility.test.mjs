import test from 'node:test'
import assert from 'node:assert/strict'
const luminance=hex=>{const c=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(values[0]+.05)/(values[1]+.05)}
test('V60 readable token pairs meet AA normal text contrast',()=>{for(const [fg,bg] of [['#263d31','#f6f1e8'],['#465849','#f8f4ea'],['#52634f','#fffdf8'],['#48583f','#f1e8d9'],['#ffffff','#294536'],['#453c29','#efddbd'],['#455742','#fbf8f1'],['#ffffff','#203a2b']])assert.ok(contrast(fg,bg)>=4.5,`${fg} / ${bg}: ${contrast(fg,bg).toFixed(2)}`)})
