function fullJoin(JSON1,JSON2,key){
var excluded = {};

// Join JSON2 to JSON1
// also track elements in JSON2 not in JSON1
var result = JSON1.map(function(a) {
      JSON2.forEach(function(element, index, array) {
        if (a[key] === element[key]) {
          Object.keys(element).forEach(function(key) {
            a[key] = element[key];
          });
        } else {
            this.visited = this.visited + 1 || 0; 
            if(this.visited == array.length)  {
              this.found = this.found || [];
              this.found.push(element);
            }
        }
      }, this);
      this.visited = 0;
        return a;
      }, excluded);

// add elements in JSON2 not in JSON1
if(excluded.found) {
   excluded.found.forEach(function(element) {
       result.push(element);
   });
}
return result;
} 

function fullJoin2(a, b,test) {
  var r = [];
  a.forEach(function (a) {
    var found = false;
    b.forEach(function (b) {
      if (test(a,b)) {
        var j = Object.assign(a, b);
        r.push(j);
        found = true;
      }
    })
    if (!found) r.push(a);
  });
  b.forEach(function (b) {
    var found = false;
    a.forEach(function (a) {
      if (test(a,b)) found = true;
    });
    if (!found) r.push(b);
  });
  return r;
}
