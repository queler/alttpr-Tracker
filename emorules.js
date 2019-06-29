'use strict';
var JSON5 = require('json5');
var fs = require('fs');
var os = require('os');
var path = require('path');
var program = require('commander');
var gs=require('get-stream' ) ;
var { parse } = require('json2csv'); 
function initObj() {
   return [ { map: 'ow',
    mode: 'reg',
    path: '/storage/emulated/0/repo/emo/locations/overworld.json' },
  { map: 'ow',
    mode: 'inv',
    path: '/storage/emulated/0/repo/alttpr-Tracker/owinv.json' },
  { map: 'dun',
    mode: 'inv',
    path:
     '/storage/emulated/0/repo/emo/inverted/locations/dungeons.json' },
  { map: 'dun',
    mode: 'reg',
    path: '/storage/emulated/0/repo/emo/locations/dungeons.json' } ]
} 

//program.option('--csv').parse(process.argv);

function traverse(obj,func,parents, desc){
//func(obj, parents, desc)
   desc=(desc||'root' );
   parents=(parents||[]);
   if (Array.isArray(obj)) {
      
      obj.forEach((a)=>
			      traverse(a,func,parents,desc )
			   );
	  }
   else {
     // console.log("about to call func on obj which is" + (typeof obj) );
      func(obj,parents, desc);
     // console.log("returned from func") ;
      var newP=parents.slice(0);
      newP.unshift(obj);
      traverse(obj.children||[],
         func,
         newP,
         "child") ;
      traverse(obj.sections||[],
      func,
      newP,
      'section') 
   }
}
function prefix(l, pre) 
{
   return pre?pre+l.charAt(0).toUpperCase()+l.slice(1):l;
} 
function flattenEmo(j, pre) {
   var fi=[] ;
   traverse(j,(o,p, d) =>{
      if ('access_rules' in o) {
         var it={} ;
         it[prefix("name") ] =(d=="section"? p[0].name+"::" : "" ) +o.name;
         it[prefix("parentRule", pre) ] =(p.find(anc=>
            "access_rules" in anc
         )||{name:"" }).name;
         it[prefix("rule", pre) ]=(o.access_rules||[] ).join(" || ");
         fi.push(it);
      } 
   });
   return fi;
}
function thr(e){throw e;}
try {
  gs(process.stdin).then((input) =>{
  input=input.trim().replace(/\/\/[^\n]*\n/g,"\n");
  var obj=JSON5.parse(input);
  var flat=flattenEmo(obj)
  var output =program.csv?parse(flat ):JSON.stringify(flat) ;
  console.log(output);
  } //lambda
,thr)
.catch(thr )
} catch (err) {
  thr(err);
}
function auto()
{
   var p=initObj();
   p.forEach( o=>       o.emo = JSON5.parse(fs.readFileSync(o.path)));
   p.forEach(o=>o.flat=flattenEmo(o,o.mode));
}
