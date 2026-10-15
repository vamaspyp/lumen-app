// A69: bind post-commit evidence to immutable source requirements; never rewrite source.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const fail=m=>{throw Error('EVIDENCE_BUNDLE_BLOCK: '+m)};
export function prepareEvidence(bundleFile,target,root=process.cwd()) {
 const paths={a63:'governance/a69-a63-conformity.json',premium:'governance/a69-source-premium-pilot.json'};
 if(!bundleFile)return paths;
 if(!/^[a-f0-9]{40}$/.test(target||''))fail('exact target SHA required');
 const bundle=JSON.parse(fs.readFileSync(bundleFile,'utf8'));
 if(bundle.schema_version!==1||bundle.target_sha!==target)fail('foreign SHA or invalid schema');
 const dest='.conformity/'+target;
 const files=bundle.files||{};
 for(const [name,value] of Object.entries(files)){
  if(['a63.json','premium.json'].includes(name))fail('reserved contract filename');
  if(!/^[a-zA-Z0-9_-]+\.json$/.test(name)||typeof value!=='object'||value===null||Array.isArray(value))fail('unsafe evidence file');
 }
 const patches=bundle.contracts;
 if(!patches||typeof patches!=='object')fail('contracts absent');
 for(const key of Object.keys(patches))if(!Object.hasOwn(paths,key))fail('unknown domain');
 const out={};const allow=new Set(['id','status','acceptance_criteria','design','implementation','tests','test_cases','evidence','review']);
 for(const [domain,source] of Object.entries(paths)){
  const base=JSON.parse(fs.readFileSync(path.join(root,source),'utf8'));const patch=patches[domain];
  if(patch){
   if(Object.keys(patch).some(k=>!['certification','requirements','release_authorization'].includes(k)))fail('source metadata cannot be changed');
   if(patch.certification!==undefined)base.certification=patch.certification;
   if(patch.release_authorization!==undefined)base.release_authorization=patch.release_authorization;
   if(!Array.isArray(patch.requirements))fail('requirement patches absent');
   const seen=new Set();
   for(const p of patch.requirements){
    if(Object.keys(p).some(k=>!allow.has(k))||seen.has(p.id))fail('source mutation or duplicate requirement');seen.add(p.id);
    const row=base.requirements.find(r=>r.id===p.id);if(!row)fail('unknown requirement');
    const update=structuredClone(p);
    if(update.evidence)for(const e of update.evidence){if(!Object.hasOwn(files,e.path))fail('missing evidence file');e.path=dest+'/'+e.path;}
    if(update.review){if(!Object.hasOwn(files,update.review.record_path))fail('missing review file');update.review.record_path=dest+'/'+update.review.record_path;}
    Object.assign(row,update);
   }
  }
  out[domain]=dest+'/'+domain+'.json';
  fs.mkdirSync(path.join(root,dest),{recursive:true});fs.writeFileSync(path.join(root,out[domain]),JSON.stringify(base,null,2)+'\n');
 }
 for(const [name,value] of Object.entries(files))fs.writeFileSync(path.join(root,dest,name),JSON.stringify(value,null,2)+'\n');
 return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const out=prepareEvidence(process.env.CONFORMITY_BUNDLE_FILE,process.env.CONFORMITY_TARGET_SHA);
 if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,'CONFORMITY_FILE='+out.a63+'\nPREMIUM_CONTRACT_FILE='+out.premium+'\n');
 console.log('EVIDENCE_INPUTS_READY: '+JSON.stringify(out));
}
