'use strict' ;
var fs=require('fs');
var j=JSON.parse(fs.readFileSync('owinv.json'));

const{ parse} =require('json2csv') ;
var reg=JSON.parse(fs.readFileSync('owreg.json'));
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
      func(obj,parents, desc);
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
var fi=[] ;
traverse(j,(o,p, d) =>{
   if ('access_rules' in o) {
      var it={} ;
      it.name=(d=="section"? p[0].name+"::" : "" ) +o.name;
      it.parentRule=(p.find(anc=>
         "access_rules" in anc
      )||{name:"" }).name;
      it.rule=(o.access_rules||[] ).join(" || ");
      fi.push(it);
   } 
});try {
  const csv = parse(fi );
  console.log(csv);
} catch (err) {
  console.error(err);
}
console.log(fi);