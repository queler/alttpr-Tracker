'use strict' ;
var fs=require('fs');
var j=JSON.parse(fs.readFileSync('owinv.json'));
var reg=JSON.parse(fs.readFileSync('owreg.json'));
function traverse(obj,func,parents, desc){
//func(obj,desc)
   desc=(desc||'root' );
   parents=(parents||[]);
   if (Array.isArray(obj)) {
      
      obj.forEach((a)=>
			      traverse(a,func,parents,desc )
			   );
	  }
   else { 
      func(obj,desc);
      var newP=parents.concat(obj);
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