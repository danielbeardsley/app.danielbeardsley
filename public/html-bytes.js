window.addEventListener('load', () =>  {
   const button = document.getElementById('submit');
   button.addEventListener('click', analyze);

   function analyze() {
      const text = document.getElementById('html').value;

      const doc = document.createElement('html');
      doc.innerHTML = text;
      visitNode(doc);
      console.log("Size: " + doc.innerHTML.length);
   }
});

function visitNode(node, parent, indent = 0) {
   console.log(" ".repeat(indent) + node.tagName + ":" + node.outerHTML.length);

   if (node.children) {
      for (const childNode of node.children) {
         visitNode(childNode, node, indent + 2);
      }
   }
}
